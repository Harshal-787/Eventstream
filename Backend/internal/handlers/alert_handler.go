package handlers

import (
	"net/http"
	"strconv"
	"time"

	"eventstream/internal/models"
	"eventstream/internal/repository"

	"github.com/gin-gonic/gin"
)

type AlertHandler struct {
	alertRepo *repository.AlertRepository
}

func NewAlertHandler(alertRepo *repository.AlertRepository) *AlertHandler {
	return &AlertHandler{alertRepo: alertRepo}
}

// List godoc
// @Summary      List alerts
// @Description  Returns all alerts, optionally filtered by status
// @Tags         Alerts
// @Produce      json
// @Security     BearerAuth
// @Param        status  query  string  false  "Filter by status: open, acknowledged, resolved"
// @Success      200  {object}  map[string]interface{}
// @Failure      500  {object}  map[string]string
// @Router       /alerts [get]
func (h *AlertHandler) List(c *gin.Context) {
	status := c.Query("status") // optional filter: open, acknowledged, resolved
	alerts, err := h.alertRepo.List(status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch alerts"})
		return
	}
	if alerts == nil {
		alerts = []*models.Alert{}
	}
	c.JSON(http.StatusOK, gin.H{"data": alerts})
}

// Get godoc
// @Summary      Get alert detail
// @Description  Returns a single alert with its activity log
// @Tags         Alerts
// @Produce      json
// @Security     BearerAuth
// @Param        id  path  int  true  "Alert ID"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Router       /alerts/{id} [get]
func (h *AlertHandler) Get(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert id"})
		return
	}

	alert, err := h.alertRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch alert"})
		return
	}
	if alert == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "alert not found"})
		return
	}

	logs, err := h.alertRepo.GetActivityLogs(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch activity logs"})
		return
	}
	if logs == nil {
		logs = []*models.AlertActivityLog{}
	}

	c.JSON(http.StatusOK, gin.H{"data": alert, "activity_logs": logs})
}

type actionRequest struct {
	Note string `json:"note"`
}

// Acknowledge godoc
// @Summary      Acknowledge an alert
// @Description  Marks an open alert as acknowledged
// @Tags         Alerts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path  int           true  "Alert ID"
// @Param        body  body  actionRequest false "Optional note"
// @Success      200  {object}  map[string]string
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Router       /alerts/{id}/acknowledge [post]
func (h *AlertHandler) Acknowledge(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert id"})
		return
	}

	alert, err := h.alertRepo.FindByID(id)
	if err != nil || alert == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "alert not found"})
		return
	}
	if alert.Status != "open" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only open alerts can be acknowledged"})
		return
	}

	var req actionRequest
	c.ShouldBindJSON(&req)

	if err := h.alertRepo.UpdateStatus(id, "acknowledged", time.Now()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update alert"})
		return
	}

	userID := c.GetInt("user_id")
	h.alertRepo.CreateActivityLog(id, userID, "acknowledged", req.Note)

	c.JSON(http.StatusOK, gin.H{"message": "alert acknowledged"})
}

// Resolve godoc
// @Summary      Resolve an alert
// @Description  Marks an alert as resolved
// @Tags         Alerts
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path  int           true  "Alert ID"
// @Param        body  body  actionRequest false "Optional note"
// @Success      200  {object}  map[string]string
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Router       /alerts/{id}/resolve [post]
func (h *AlertHandler) Resolve(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert id"})
		return
	}

	alert, err := h.alertRepo.FindByID(id)
	if err != nil || alert == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "alert not found"})
		return
	}
	if alert.Status == "resolved" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "alert is already resolved"})
		return
	}

	var req actionRequest
	c.ShouldBindJSON(&req)

	if err := h.alertRepo.UpdateStatus(id, "resolved", time.Now()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update alert"})
		return
	}

	userID := c.GetInt("user_id")
	h.alertRepo.CreateActivityLog(id, userID, "resolved", req.Note)

	c.JSON(http.StatusOK, gin.H{"message": "alert resolved"})
}
