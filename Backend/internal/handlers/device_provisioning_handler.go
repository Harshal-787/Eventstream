package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"eventstream/internal/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ProvisioningHandler struct {
	deviceRepo *repository.DeviceRepo
}

func NewProvisioningHandler(deviceRepo *repository.DeviceRepo) *ProvisioningHandler {
	return &ProvisioningHandler{
		deviceRepo: deviceRepo,
	}
}

func generateProvisioningToken() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (h *ProvisioningHandler) GenerateToken(c *gin.Context) {
	orgIDStr, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "organization_id missing"})
		return
	}
	orgID := orgIDStr.(int)

	deviceIDStr := c.Param("id")
	deviceID, err := strconv.Atoi(deviceIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	device, err := h.deviceRepo.GetDeviceByID(deviceID)
	if err != nil || device == nil || device.OrganizationID != orgID {
		c.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	token := generateProvisioningToken()
	
	// Update device with the new token and status
	device.ProvisioningToken = &token
	device.ActivationStatus = "pending"
	
	if err := h.deviceRepo.UpdateDevice(device); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update device token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token generated successfully",
		"token": token,
	})
}
