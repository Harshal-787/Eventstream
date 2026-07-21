package handlers

import (
	"encoding/json"
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ReportScheduleHandler struct {
	Repo *repository.ReportScheduleRepo
}

func NewReportScheduleHandler(repo *repository.ReportScheduleRepo) *ReportScheduleHandler {
	return &ReportScheduleHandler{Repo: repo}
}

// CreateSchedule godoc
// @Summary Create report schedule
// @Tags report-schedules
// @Accept json
// @Produce json
// @Param schedule body models.ReportSchedule true "Report Schedule Info"
// @Success 201 {object} models.ReportSchedule
// @Router /reports/schedules [post]
func (h *ReportScheduleHandler) CreateSchedule(c *gin.Context) {
	orgIDVal, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	orgID := orgIDVal.(int)

	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(int)

	var req struct {
		ReportType string   `json:"report_type"`
		Format     string   `json:"format"`
		Frequency  string   `json:"frequency"`
		Recipients []string `json:"recipients"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	recipientsJSON, err := json.Marshal(req.Recipients)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process recipients"})
		return
	}

	sched := models.ReportSchedule{
		OrganizationID: orgID,
		ReportType:     req.ReportType,
		Format:         req.Format,
		Frequency:      req.Frequency,
		Recipients:     recipientsJSON,
		CreatedBy:      &userID,
	}

	if err := h.Repo.Create(&sched); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create schedule"})
		return
	}

	c.JSON(http.StatusCreated, sched)
}

// GetSchedules godoc
// @Summary List report schedules
// @Tags report-schedules
// @Produce json
// @Success 200 {array} models.ReportSchedule
// @Router /reports/schedules [get]
func (h *ReportScheduleHandler) GetSchedules(c *gin.Context) {
	orgIDVal, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	orgID := orgIDVal.(int)

	schedules, err := h.Repo.GetAllByOrg(orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch schedules"})
		return
	}

	if schedules == nil {
		schedules = []models.ReportSchedule{}
	}

	c.JSON(http.StatusOK, schedules)
}

// DeleteSchedule godoc
// @Summary Delete report schedule
// @Tags report-schedules
// @Param id path int true "Schedule ID"
// @Success 200 {object} map[string]string
// @Router /reports/schedules/{id} [delete]
func (h *ReportScheduleHandler) DeleteSchedule(c *gin.Context) {
	orgIDVal, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	orgID := orgIDVal.(int)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid schedule ID"})
		return
	}

	if err := h.Repo.Delete(id, orgID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete schedule"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Schedule deleted successfully"})
}
