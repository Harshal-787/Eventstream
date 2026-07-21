package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"eventstream/internal/models"
	"eventstream/internal/repository"
	"eventstream/internal/services"

	"github.com/gin-gonic/gin"
)

type TelemetryHandler struct {
	ingestService   *services.TelemetryIngestService
	telemetryRepo   *repository.TelemetryRepository
	failedEventRepo *repository.FailedEventRepository
}

func NewTelemetryHandler(ingestService *services.TelemetryIngestService, telemetryRepo *repository.TelemetryRepository, failedEventRepo *repository.FailedEventRepository) *TelemetryHandler {
	return &TelemetryHandler{ingestService: ingestService, telemetryRepo: telemetryRepo, failedEventRepo: failedEventRepo}
}

func (h *TelemetryHandler) IngestEvent(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		h.failedEventRepo.LogFailedEvent(nil, "Failed to read request body", c.ClientIP())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(body, &payload); err != nil {
		h.failedEventRepo.LogFailedEvent(body, "Malformed JSON", c.ClientIP())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Malformed JSON"})
		return
	}

	deviceIDFloat, ok := payload["device_id"].(float64)
	if !ok || deviceIDFloat <= 0 {
		h.failedEventRepo.LogFailedEvent(body, "Missing or invalid device_id", c.ClientIP())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing or invalid device_id"})
		return
	}
	deviceID := int(deviceIDFloat)

	// In a real app, this would also evaluate rules and send via Hub. 
	// For this scope, we just save the telemetry to satisfy the DB ingest requirement.
	var temp, hum *float64
	if t, ok := payload["temperature"].(float64); ok { temp = &t }
	if h, ok := payload["humidity"].(float64); ok { hum = &h }
	status := "ok"

	orgID, _ := c.Get("organization_id")
	
	t := &models.Telemetry{
		OrganizationID: orgID.(int),
		DeviceID:    deviceID,
		Temperature: temp,
		Humidity:    hum,
		Status:      &status,
		Payload:     payload,
		Timestamp:   time.Now(),
	}

	if err := h.ingestService.Ingest(t); err != nil {
		h.failedEventRepo.LogFailedEvent(body, "Failed to ingest telemetry", c.ClientIP())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "Ingested successfully"})
}

func (h *TelemetryHandler) GetEvents(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	filters := map[string]interface{}{}
	if buildingID := c.Query("building_id"); buildingID != "" { filters["building_id"] = buildingID }
	if deviceID := c.Query("device_id"); deviceID != "" { filters["device_id"] = deviceID }
	if eventType := c.Query("event_type"); eventType != "" { filters["event_type"] = eventType }
	if startDate := c.Query("start_date"); startDate != "" { filters["start_date"] = startDate }
	if endDate := c.Query("end_date"); endDate != "" { filters["end_date"] = endDate }

	events, total, err := h.telemetryRepo.GetHistoricalEvents(limit, offset, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  events,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
