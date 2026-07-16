package handlers

import (
	"net/http"
	"strconv"

	"eventstream/internal/repository"

	"github.com/gin-gonic/gin"
)

type FailedEventHandler struct {
	repo *repository.FailedEventRepository
}

func NewFailedEventHandler(repo *repository.FailedEventRepository) *FailedEventHandler {
	return &FailedEventHandler{repo: repo}
}

func (h *FailedEventHandler) GetFailedEvents(c *gin.Context) {
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

	events, total, err := h.repo.GetFailedEvents(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch failed events"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  events,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
