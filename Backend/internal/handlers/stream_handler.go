package handlers

import (
	"encoding/json"
	"io"

	"eventstream/internal/events"

	"github.com/gin-gonic/gin"
)

type StreamHandler struct {
	hub *events.Hub
}

func NewStreamHandler(hub *events.Hub) *StreamHandler {
	return &StreamHandler{hub: hub}
}

// StreamTelemetry godoc
// @Summary      Real-time telemetry stream
// @Description  Establishes an SSE connection for real-time telemetry updates
// @Tags         Telemetry
// @Produce      text/event-stream
// @Security     BearerAuth
// @Success      200  {string} string "SSE Stream"
// @Router       /stream [get]
func (h *StreamHandler) StreamTelemetry(c *gin.Context) {
	// Set headers for SSE
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no") // Disable Nginx proxy buffering

	// Create a client channel
	clientChan := make(chan *events.StreamEvent)

	// Register client with the hub
	h.hub.Register <- clientChan

	// Ensure cleanup when client disconnects
	defer func() {
		h.hub.Unregister <- clientChan
	}()

	// Listen for connection close
	notify := c.Writer.CloseNotify()

	c.Stream(func(w io.Writer) bool {
		select {
		case <-notify:
			return false
		case event, ok := <-clientChan:
			if !ok {
				return false
			}
			// Marshal and write the SSE event
			payloadBytes, err := json.Marshal(event.Payload)
			if err == nil {
				c.SSEvent(event.Type, string(payloadBytes))
			}
			c.Writer.Flush()
			return true
		}
	})
}
