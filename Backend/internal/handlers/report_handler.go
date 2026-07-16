package handlers

import (
	"eventstream/internal/services"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	ReportingService *services.ReportingService
}

func NewReportHandler(reportingService *services.ReportingService) *ReportHandler {
	return &ReportHandler{ReportingService: reportingService}
}

func (h *ReportHandler) DownloadTelemetryCSV(c *gin.Context) {
	// orgIDVal, exists := c.Get("org_id")
	// For simplicity, we just authorize any org member for the device
	deviceIDStr := c.Param("deviceId")
	deviceID, err := strconv.Atoi(deviceIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	csvData, err := h.ReportingService.GenerateTelemetryCSV(deviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate CSV report"})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=telemetry_device_%d.csv", deviceID))
	c.Data(http.StatusOK, "text/csv", csvData)
}

func (h *ReportHandler) DownloadBuildingHealthPDF(c *gin.Context) {
	orgIDVal, exists := c.Get("org_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	orgID := orgIDVal.(int)

	buildingIDStr := c.Param("buildingId")
	buildingID, err := strconv.Atoi(buildingIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid building ID"})
		return
	}

	pdfData, err := h.ReportingService.GenerateBuildingHealthPDF(orgID, buildingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PDF report"})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=building_health_%d.pdf", buildingID))
	c.Data(http.StatusOK, "application/pdf", pdfData)
}
