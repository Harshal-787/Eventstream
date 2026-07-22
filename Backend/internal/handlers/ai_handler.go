package handlers

import (
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"eventstream/internal/services"
	"net/http"
	"strconv"
	"log"

	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	aiConfigRepo *repository.AIConfigRepo
	aiService    *services.AIService
	alertRepo    *repository.AlertRepository
	telemetryRepo *repository.TelemetryRepository
	deviceRepo   *repository.DeviceRepo
}

func NewAIHandler(aiConfigRepo *repository.AIConfigRepo, aiService *services.AIService, alertRepo *repository.AlertRepository, telemetryRepo *repository.TelemetryRepository, deviceRepo *repository.DeviceRepo) *AIHandler {
	return &AIHandler{aiConfigRepo: aiConfigRepo, aiService: aiService, alertRepo: alertRepo, telemetryRepo: telemetryRepo, deviceRepo: deviceRepo}
}

// Get AI Config
func (h *AIHandler) GetConfig(c *gin.Context) {
	orgID, _ := c.Get("organization_id")
	cfg, err := h.aiConfigRepo.GetActiveConfig(orgID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get AI config"})
		return
	}
	if cfg == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active config"})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

// Set AI Config
func (h *AIHandler) SetConfig(c *gin.Context) {
	orgID, _ := c.Get("organization_id")
	var req models.AIConfiguration
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	req.OrganizationID = orgID.(int)
	if err := h.aiConfigRepo.SetConfig(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save AI config"})
		return
	}
	c.JSON(http.StatusOK, req)
}

// Event Summary API
func (h *AIHandler) GenerateEventSummary(c *gin.Context) {
	orgID, _ := c.Get("organization_id")
	
	filters := map[string]interface{}{}
	if deviceID := c.Query("device_id"); deviceID != "" { filters["device_id"] = deviceID }
	
	// Fetch last 20 events for summary
	events, _, err := h.telemetryRepo.GetHistoricalEvents(20, 0, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events"})
		return
	}

	summary, err := h.aiService.GenerateSummary(orgID.(int), events)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

// Alert Root Cause Analysis API
func (h *AIHandler) AnalyzeAlertRCA(c *gin.Context) {
	orgID, _ := c.Get("organization_id")
	alertID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Fetch alert
	alert, err := h.alertRepo.FindByID(alertID)
	if err != nil || alert == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
		return
	}

	// Fetch context events leading up to alert
	deviceIDStr := ""
	if alert.DeviceID != nil {
		deviceIDStr = strconv.Itoa(*alert.DeviceID)
	}
	filters := map[string]interface{}{
		"device_id": deviceIDStr,
		"end_date": alert.TriggeredAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	events, _, _ := h.telemetryRepo.GetHistoricalEvents(20, 0, filters)

	rca, err := h.aiService.AnalyzeRootCause(orgID.(int), alert, events)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"analysis": rca})
}

// Predictive Maintenance API
func (h *AIHandler) PredictMaintenance(c *gin.Context) {
	orgID, _ := c.Get("organization_id")
	deviceID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	device, err := h.deviceRepo.GetDeviceByID(deviceID)
	if err != nil || device == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	filters := map[string]interface{}{"device_id": strconv.Itoa(deviceID)}
	events, _, _ := h.telemetryRepo.GetHistoricalEvents(50, 0, filters)

	analysis, err := h.aiService.PredictiveMaintenance(orgID.(int), device, events)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"prediction": analysis})
}

// Device Health Summary API
func (h *AIHandler) GenerateDeviceHealthSummary(c *gin.Context) {
	orgID, _ := c.Get("organization_id")
	deviceID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	device, err := h.deviceRepo.GetDeviceByID(deviceID)
	if err != nil || device == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	filters := map[string]interface{}{"device_id": strconv.Itoa(deviceID)}
	events, _, _ := h.telemetryRepo.GetHistoricalEvents(100, 0, filters)

	summary, err := h.aiService.GenerateDeviceHealthSummary(orgID.(int), device, events)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

// Executive Report API
func (h *AIHandler) GenerateExecutiveReport(c *gin.Context) {
	orgID, _ := c.Get("organization_id")

	alerts, _ := h.alertRepo.List(map[string]interface{}{"status": "open", "limit": "20"})
	events, _, _ := h.telemetryRepo.GetHistoricalEvents(50, 0, map[string]interface{}{})

	report, err := h.aiService.GenerateExecutiveReport(orgID.(int), alerts, events)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"report": report})
}

// Incident Summary API
func (h *AIHandler) GenerateIncidentSummary(c *gin.Context) {
	orgID, _ := c.Get("organization_id")
	incidentID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid incident ID"})
		return
	}

	// For MVP, we simulate an incident containing multiple recent alerts
	alerts, _ := h.alertRepo.List(map[string]interface{}{"limit": "10"})

	summary, err := h.aiService.GenerateIncidentSummary(orgID.(int), incidentID, alerts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

// Chat API
func (h *AIHandler) Chat(c *gin.Context) {
	orgID, _ := c.Get("organization_id")
	
	var req struct {
		Prompt string `json:"prompt" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Prompt is required"})
		return
	}

	response, err := h.aiService.Chat(orgID.(int), req.Prompt)
	if err != nil {
		log.Printf("AI Chat Error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"response": response})
}

// GetModels API
func (h *AIHandler) GetModels(c *gin.Context) {
	var req struct {
		ProviderType string `json:"provider_type" binding:"required"`
		APIKey       string `json:"api_key" binding:"required"`
		BaseURL      string `json:"base_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	models, err := h.aiService.GetAvailableModels(req.ProviderType, req.APIKey, req.BaseURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"models": models})
}
