package handlers

import (
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"net/http"
	"strconv"
	
	"github.com/gin-gonic/gin"
)

type EscalationPolicyHandler struct {
	repo *repository.EscalationPolicyRepo
}

func NewEscalationPolicyHandler(repo *repository.EscalationPolicyRepo) *EscalationPolicyHandler {
	return &EscalationPolicyHandler{repo: repo}
}

func (h *EscalationPolicyHandler) List(c *gin.Context) {
	orgID, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "organization_id not found"})
		return
	}

	policies, err := h.repo.ListByOrg(orgID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, policies)
}

func (h *EscalationPolicyHandler) Create(c *gin.Context) {
	orgIDVal, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "organization_id not found"})
		return
	}
	orgID := orgIDVal.(int)

	var p models.EscalationPolicy
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	p.OrganizationID = orgID

	if err := h.repo.Create(&p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create escalation policy"})
		return
	}
	c.JSON(http.StatusCreated, p)
}

func (h *EscalationPolicyHandler) Update(c *gin.Context) {
	orgIDVal, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "organization_id not found"})
		return
	}
	orgID := orgIDVal.(int)

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid policy ID"})
		return
	}

	var p models.EscalationPolicy
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	p.ID = id
	p.OrganizationID = orgID

	if err := h.repo.Update(&p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update escalation policy"})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *EscalationPolicyHandler) Delete(c *gin.Context) {
	orgIDVal, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "organization_id not found"})
		return
	}
	orgID := orgIDVal.(int)

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid policy ID"})
		return
	}

	if err := h.repo.Delete(id, orgID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete escalation policy"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Escalation policy deleted"})
}
