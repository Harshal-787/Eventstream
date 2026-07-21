package handlers

import (
	"encoding/json"
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"eventstream/internal/services"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for ingestion
	},
}

type WSIngestHandler struct {
	ingestService *services.TelemetryIngestService
	deviceRepo    *repository.DeviceRepo
}

func NewWSIngestHandler(ingestService *services.TelemetryIngestService, deviceRepo *repository.DeviceRepo) *WSIngestHandler {
	return &WSIngestHandler{
		ingestService: ingestService,
		deviceRepo:    deviceRepo,
	}
}

func (h *WSIngestHandler) HandleIngest(c *gin.Context) {
	orgIDStr, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "organization_id missing"})
		return
	}
	orgID := orgIDStr.(int)

	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade to websocket: %v", err)
		return
	}
	defer ws.Close()

	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			break
		}

		var payload map[string]interface{}
		if err := json.Unmarshal(message, &payload); err != nil {
			ws.WriteJSON(gin.H{"error": "invalid JSON"})
			continue
		}

		hardwareID, ok := payload["hardware_id"].(string)
		if !ok {
			ws.WriteJSON(gin.H{"error": "hardware_id is required"})
			continue
		}

		// Find device
		device, err := h.deviceRepo.GetDeviceByHardwareID(hardwareID)
		if err != nil || device == nil || device.OrganizationID != orgID {
			ws.WriteJSON(gin.H{"error": "Device not found or unauthorized"})
			continue
		}

		// Save telemetry
		tel := &models.Telemetry{
			OrganizationID: orgID,
			DeviceID:       device.ID,
			Timestamp:      time.Now(),
			Payload:        payload,
		}

		if err := h.ingestService.Ingest(tel); err != nil {
			ws.WriteJSON(gin.H{"error": "failed to save telemetry"})
			continue
		}

		// Acknowledge receipt
		ws.WriteJSON(gin.H{"status": "received"})
	}
}
