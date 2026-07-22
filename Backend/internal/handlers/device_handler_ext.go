package handlers

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
)

func (h *DeviceHandler) GetFloor(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid floor ID"})
		return
	}

	floor, err := h.Repo.GetFloorByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get floor"})
		return
	}
	if floor == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Floor not found"})
		return
	}

	c.JSON(http.StatusOK, floor)
}
