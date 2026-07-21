package handlers

import (
	"eventstream/internal/services"
	"fmt"
	"net/http"

	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	ReportingService *services.ReportingService
}

func NewReportHandler(reportingService *services.ReportingService) *ReportHandler {
	return &ReportHandler{ReportingService: reportingService}
}

// ExportReport godoc
// @Summary Export reports
// @Description Export various reports in CSV, PDF, or Excel formats
// @Tags reports
// @Accept json
// @Produce json
// @Param type query string true "Report type (event_statistics, alert_trends, device_availability, device_health, building_performance, sensor_activity, user_activity, audit_logs)"
// @Param format query string true "Export format (csv, pdf, excel)"
// @Success 200 {file} file
// @Router /reports/export [get]
func (h *ReportHandler) ExportReport(c *gin.Context) {
	orgIDVal, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	orgID := orgIDVal.(int)

	reportType := c.Query("type")
	format := c.Query("format")

	if reportType == "" || format == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing type or format parameters"})
		return
	}

	filters := services.ReportFilters{}
	if bIdStr := c.Query("building_id"); bIdStr != "" {
		if id, err := strconv.Atoi(bIdStr); err == nil {
			filters.BuildingID = &id
		}
		fmt.Println("Parsed building_id:", filters.BuildingID)
	}
	if startStr := c.Query("start_date"); startStr != "" {
		if t, err := time.Parse(time.RFC3339, startStr); err == nil {
			filters.StartDate = &t
		} else {
			fmt.Println("Error parsing start_date:", err)
		}
		fmt.Println("Parsed start_date:", filters.StartDate)
	}
	if endStr := c.Query("end_date"); endStr != "" {
		if t, err := time.Parse(time.RFC3339, endStr); err == nil {
			filters.EndDate = &t
		} else {
			fmt.Println("Error parsing end_date:", err)
		}
		fmt.Println("Parsed end_date:", filters.EndDate)
	}

	var data services.ReportData
	var err error

	switch reportType {
	case "event_statistics":
		data, err = h.ReportingService.GetEventStatistics(orgID, filters)
	case "alert_trends":
		data, err = h.ReportingService.GetAlertTrends(orgID, filters)
	case "device_availability":
		data, err = h.ReportingService.GetDeviceAvailability(orgID, filters)
	case "device_health":
		data, err = h.ReportingService.GetDeviceHealth(orgID, filters)
	case "building_performance":
		data, err = h.ReportingService.GetBuildingPerformance(orgID, filters)
	case "sensor_activity":
		data, err = h.ReportingService.GetSensorActivity(orgID, filters)
	case "user_activity":
		data, err = h.ReportingService.GetUserActivity(orgID, filters)
	case "audit_logs":
		data, err = h.ReportingService.GetAuditLogs(orgID, filters)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report type"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch report data"})
		return
	}

	var fileBytes []byte
	var contentType string
	var extension string

	switch format {
	case "csv":
		fileBytes, err = services.ExportCSV(data)
		contentType = "text/csv"
		extension = "csv"
	case "pdf":
		fileBytes, err = services.ExportPDF(data)
		contentType = "application/pdf"
		extension = "pdf"
	case "excel":
		fileBytes, err = services.ExportExcel(data)
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		extension = "xlsx"
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid format"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate file"})
		return
	}

	filename := fmt.Sprintf("%s.%s", reportType, extension)
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Data(http.StatusOK, contentType, fileBytes)
}
