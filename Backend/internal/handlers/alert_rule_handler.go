package handlers

import (
	"net/http"
	"strconv"

	"eventstream/internal/models"
	"eventstream/internal/repository"
	"eventstream/internal/services"

	"github.com/gin-gonic/gin"
)

type AlertRuleHandler struct {
	ruleRepo *repository.AlertRuleRepository
	logger   *services.AuditLogger
}

func NewAlertRuleHandler(repo *repository.AlertRuleRepository, logger *services.AuditLogger) *AlertRuleHandler {
	return &AlertRuleHandler{ruleRepo: repo, logger: logger}
}

func (h *AlertRuleHandler) List(c *gin.Context) {
	orgID := c.GetInt("organization_id")
	rules, err := h.ruleRepo.List(orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch alert rules"})
		return
	}
	if rules == nil {
		rules = []models.AlertRule{}
	}
	c.JSON(http.StatusOK, gin.H{"data": rules})
}

func (h *AlertRuleHandler) Create(c *gin.Context) {
	var rule models.AlertRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	userID := c.GetInt("user_id")
	orgID := c.GetInt("organization_id")
	rule.CreatedBy = &userID
	rule.OrganizationID = orgID

	if err := h.ruleRepo.Create(&rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create rule"})
		return
	}

	entityType := "alert_rule"
	h.logger.Log(&userID, "RULE_CREATED", &entityType, &rule.ID, rule, c.ClientIP())

	c.JSON(http.StatusCreated, gin.H{"data": rule})
}

func (h *AlertRuleHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	var rule models.AlertRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	if err := h.ruleRepo.Update(id, &rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update rule"})
		return
	}

	userID := c.GetInt("user_id")
	entityType := "alert_rule"
	h.logger.Log(&userID, "RULE_UPDATED", &entityType, &id, rule, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "Rule updated successfully"})
}

func (h *AlertRuleHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	if err := h.ruleRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete rule"})
		return
	}

	userID := c.GetInt("user_id")
	entityType := "alert_rule"
	h.logger.Log(&userID, "RULE_DELETED", &entityType, &id, map[string]interface{}{}, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "Rule deleted successfully"})
}
