package handlers

import (
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type NotificationChannelHandler struct {
	Repo *repository.NotificationChannelRepo
}

func NewNotificationChannelHandler(repo *repository.NotificationChannelRepo) *NotificationChannelHandler {
	return &NotificationChannelHandler{Repo: repo}
}

func (h *NotificationChannelHandler) Create(c *gin.Context) {
	orgIDVal, exists := c.Get("org_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	orgID := orgIDVal.(int)

	var nc models.NotificationChannel
	if err := c.ShouldBindJSON(&nc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	nc.OrganizationID = orgID

	if err := h.Repo.Create(&nc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification channel"})
		return
	}

	c.JSON(http.StatusCreated, nc)
}

func (h *NotificationChannelHandler) List(c *gin.Context) {
	orgIDVal, exists := c.Get("org_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	orgID := orgIDVal.(int)

	channels, err := h.Repo.ListByOrg(orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notification channels"})
		return
	}

	c.JSON(http.StatusOK, channels)
}

func (h *NotificationChannelHandler) Update(c *gin.Context) {
	orgIDVal, exists := c.Get("org_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	orgID := orgIDVal.(int)

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid channel ID"})
		return
	}

	var nc models.NotificationChannel
	if err := c.ShouldBindJSON(&nc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	nc.ID = id
	nc.OrganizationID = orgID

	if err := h.Repo.Update(&nc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification channel"})
		return
	}

	c.JSON(http.StatusOK, nc)
}

func (h *NotificationChannelHandler) Delete(c *gin.Context) {
	orgIDVal, exists := c.Get("org_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	orgID := orgIDVal.(int)

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid channel ID"})
		return
	}

	if err := h.Repo.Delete(id, orgID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification channel"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification channel deleted"})
}
