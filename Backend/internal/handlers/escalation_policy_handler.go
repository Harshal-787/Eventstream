package handlers

import (
	"eventstream/internal/repository"
	"net/http"
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
