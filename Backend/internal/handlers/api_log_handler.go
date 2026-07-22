package handlers

import (
	"eventstream/internal/repository"
	"net/http"
	"strconv"
	"eventstream/internal/models"

	"github.com/gin-gonic/gin"
)

type APILogHandler struct {
	repo *repository.APIUsageRepository
}

func NewAPILogHandler(repo *repository.APIUsageRepository) *APILogHandler {
	return &APILogHandler{repo: repo}
}

func (h *APILogHandler) GetLogs(c *gin.Context) {
	orgID, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "organization_id missing"})
		return
	}

	limitStr := c.Query("limit")
	limit := 100 // default
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 1000 {
			limit = l
		}
	}

	logs, err := h.repo.GetLogs(orgID.(int), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get API logs", "details": err.Error()})
		return
	}

	if logs == nil {
		logs = []models.APILog{} // Don't return null
	}

	c.JSON(http.StatusOK, logs)
}
