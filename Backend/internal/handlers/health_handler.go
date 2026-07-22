package handlers

import (
	"eventstream/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct {
	Service *services.HealthService
}

func NewHealthHandler(service *services.HealthService) *HealthHandler {
	return &HealthHandler{Service: service}
}

// GetSystemHealth godoc
// @Summary Get system health metrics
// @Description Fetches real-time database, API, queue, and worker health metrics
// @Tags system
// @Produce json
// @Success 200 {object} services.HealthMetrics
// @Router /system/health [get]
func (h *HealthHandler) GetSystemHealth(c *gin.Context) {
	metrics, err := h.Service.GetSystemHealth()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch health metrics"})
		return
	}
	c.JSON(http.StatusOK, metrics)
}
