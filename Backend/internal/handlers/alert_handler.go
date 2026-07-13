package handlers

import (
	"net/http"
	"strconv"
	"time"

	"eventstream/internal/events"
	"eventstream/internal/models"
	"eventstream/internal/repository"

	"github.com/gin-gonic/gin"
)

type AlertHandler struct {
	alertRepo *repository.AlertRepository
	hub       *events.Hub
}

func NewAlertHandler(alertRepo *repository.AlertRepository, hub *events.Hub) *AlertHandler {
	return &AlertHandler{alertRepo: alertRepo, hub: hub}
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
	// We no longer need to check status here, the database transaction handles it securely.

	var req actionRequest
	if err := c.ShouldBindJSON(&req); err != nil && err.Error() != "EOF" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json payload"})
		return
	}

	userID := c.GetInt("user_id")
	
	err = h.alertRepo.TransitionStatus(id, "open", "acknowledged", userID, req.Note, time.Now())
	if err != nil {
		if err.Error() == "conflict: alert not found or not in the expected state" {
			c.JSON(http.StatusConflict, gin.H{"error": "alert is no longer open or does not exist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not acknowledge alert"})
		return
	}

	h.hub.Broadcast <- &events.StreamEvent{
		Type: "alert_update",
		Payload: map[string]interface{}{
			"id": id,
			"status": "acknowledged",
		},
	}

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
	// We no longer need to check status here, the database transaction handles it securely.

	var req actionRequest
	if err := c.ShouldBindJSON(&req); err != nil && err.Error() != "EOF" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json payload"})
		return
	}

	userID := c.GetInt("user_id")

	// Usually we resolve acknowledged alerts, but we can also resolve open ones.
	// So we pass the current status to the transition function.
	err = h.alertRepo.TransitionStatus(id, alert.Status, "resolved", userID, req.Note, time.Now())
	if err != nil {
		if err.Error() == "conflict: alert not found or not in the expected state" {
			c.JSON(http.StatusConflict, gin.H{"error": "alert state changed during request"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not resolve alert"})
		return
	}

	h.hub.Broadcast <- &events.StreamEvent{
		Type: "alert_update",
		Payload: map[string]interface{}{
			"id": id,
			"status": "resolved",
		},
	}

	c.JSON(http.StatusOK, gin.H{"message": "alert resolved"})
}

// Delete godoc
// @Summary      Delete an alert
// @Description  Permanently deletes an alert
// @Tags         Alerts
// @Produce      json
// @Security     BearerAuth
// @Param        id  path  int  true  "Alert ID"
// @Success      200  {object}  map[string]string
// @Failure      400  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /alerts/{id} [delete]
func (h *AlertHandler) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert ID"})
		return
	}

	if err := h.alertRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete alert"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "alert deleted successfully"})
}

func (h *AlertHandler) ClearAll(c *gin.Context) {
	if err := h.alertRepo.DeleteAll(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to clear alerts"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "all alerts cleared successfully"})
}
