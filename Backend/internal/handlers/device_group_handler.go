package handlers

import (
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type DeviceGroupHandler struct {
	Repo *repository.DeviceGroupRepository
}

func NewDeviceGroupHandler(repo *repository.DeviceGroupRepository) *DeviceGroupHandler {
	return &DeviceGroupHandler{Repo: repo}
}

func (h *DeviceGroupHandler) Create(c *gin.Context) {
	orgID, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.DeviceGroup
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	req.OrganizationID = orgID.(int)
	if err := h.Repo.Create(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create device group"})
		return
	}
	c.JSON(http.StatusCreated, req)
}

func (h *DeviceGroupHandler) List(c *gin.Context) {
	orgID, _ := c.Get("organization_id")
	groups, err := h.Repo.ListByOrg(orgID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch device groups"})
		return
	}
	c.JSON(http.StatusOK, groups)
}

func (h *DeviceGroupHandler) Delete(c *gin.Context) {
	orgID, _ := c.Get("organization_id")
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	if err := h.Repo.Delete(id, orgID.(int)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete group"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

func (h *DeviceGroupHandler) AddMember(c *gin.Context) {
	groupID, err := strconv.Atoi(c.Param("id"))
	deviceID, err2 := strconv.Atoi(c.Param("deviceId"))
	if err != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IDs"})
		return
	}

	if err := h.Repo.AddDeviceToGroup(groupID, deviceID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add device to group"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Device added to group"})
}

func (h *DeviceGroupHandler) RemoveMember(c *gin.Context) {
	groupID, err := strconv.Atoi(c.Param("id"))
	deviceID, err2 := strconv.Atoi(c.Param("deviceId"))
	if err != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IDs"})
		return
	}

	if err := h.Repo.RemoveDeviceFromGroup(groupID, deviceID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove device from group"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Device removed from group"})
}
