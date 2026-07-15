package handlers

import (
	"encoding/json"
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"eventstream/internal/services"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type WebhookHandler struct {
	telemetryRepo   *repository.TelemetryRepository
	deviceRepo      *repository.DeviceRepo
	anomalyDetector *services.AnomalyDetector
}

func NewWebhookHandler(telemetryRepo *repository.TelemetryRepository, deviceRepo *repository.DeviceRepo, anomalyDetector *services.AnomalyDetector) *WebhookHandler {
	return &WebhookHandler{
		telemetryRepo:   telemetryRepo,
		deviceRepo:      deviceRepo,
		anomalyDetector: anomalyDetector,
	}
}

func (h *WebhookHandler) HandleWebhook(c *gin.Context) {
	// Webhooks might not have a bearer token, they might rely on a signature or token in URL.
	// We'll extract a token from query for simple auth.
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing token"})
		return
	}

	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot read body"})
		return
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	hardwareID, ok := payload["hardware_id"].(string)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "hardware_id is required"})
		return
	}

	device, err := h.deviceRepo.GetDeviceByHardwareID(hardwareID)
	if err != nil || device == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	// Simple check: does the device provisioning token match the webhook token?
	if device.ProvisioningToken == nil || *device.ProvisioningToken != token {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token for device"})
		return
	}

	tel := &models.Telemetry{
		OrganizationID: device.OrganizationID,
		DeviceID:       device.ID,
		Timestamp:      time.Now(),
		Payload:        payload,
	}

	if err := h.telemetryRepo.Insert(tel); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save telemetry"})
		return
	}

	go h.anomalyDetector.Process(tel)

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}
