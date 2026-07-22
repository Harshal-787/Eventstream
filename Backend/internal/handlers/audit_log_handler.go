package handlers

import (
	"net/http"
	"strconv"

	"eventstream/internal/repository"

	"github.com/gin-gonic/gin"
)

type AuditLogHandler struct {
	auditRepo *repository.AuditLogRepository
}

func NewAuditLogHandler(auditRepo *repository.AuditLogRepository) *AuditLogHandler {
	return &AuditLogHandler{auditRepo: auditRepo}
}

// GetLogs retrieves paginated audit logs (Admin only)
func (h *AuditLogHandler) GetLogs(c *gin.Context) {
	role, exists := c.Get("user_role")
	if !exists || role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "admin access required"})
		return
	}

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

	logs, total, err := h.auditRepo.GetLogs(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audit logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
