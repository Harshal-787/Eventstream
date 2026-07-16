package handlers

import (
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type DeviceTwinHandler struct {
	repo       *repository.DeviceTwinRepository
	deviceRepo *repository.DeviceRepo
}

func NewDeviceTwinHandler(repo *repository.DeviceTwinRepository, deviceRepo *repository.DeviceRepo) *DeviceTwinHandler {
	return &DeviceTwinHandler{repo: repo, deviceRepo: deviceRepo}
}

func (h *DeviceTwinHandler) GetTwin(c *gin.Context) {
	deviceIDStr := c.Param("id")
	deviceID, err := strconv.Atoi(deviceIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	// Verify the device belongs to the organization
	orgID, _ := c.Get("organization_id")
	device, err := h.deviceRepo.GetDeviceByID(deviceID)
	if err != nil || device == nil || device.OrganizationID != orgID.(int) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	twin, err := h.repo.GetTwin(deviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get device twin"})
		return
	}

	c.JSON(http.StatusOK, twin)
}

func (h *DeviceTwinHandler) UpdateTwin(c *gin.Context) {
	deviceIDStr := c.Param("id")
	deviceID, err := strconv.Atoi(deviceIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	orgID, _ := c.Get("organization_id")
	device, err := h.deviceRepo.GetDeviceByID(deviceID)
	if err != nil || device == nil || device.OrganizationID != orgID.(int) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	var req models.DeviceTwin
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.DeviceID = deviceID

	if err := h.repo.UpsertTwin(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update device twin"})
		return
	}

	c.JSON(http.StatusOK, req)
}
