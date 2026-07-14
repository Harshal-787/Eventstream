package handlers

import (
	"net/http"
	"strconv"

	"eventstream/internal/repository"

	"github.com/gin-gonic/gin"
)

type TelemetryHandler struct {
	telemetryRepo *repository.TelemetryRepository
}

func NewTelemetryHandler(repo *repository.TelemetryRepository) *TelemetryHandler {
	return &TelemetryHandler{telemetryRepo: repo}
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

	events, total, err := h.telemetryRepo.GetHistoricalEvents(limit, offset)
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
