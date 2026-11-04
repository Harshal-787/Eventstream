package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"eventstream/internal/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type APIKeyHandler struct {
	repo *repository.APIKeyRepository
}

func NewAPIKeyHandler(repo *repository.APIKeyRepository) *APIKeyHandler {
	return &APIKeyHandler{repo: repo}
}

type CreateAPIKeyRequest struct {
	Name      string   `json:"name" binding:"required"`
	Scopes    []string `json:"scopes"`
	ExpiresIn *int     `json:"expires_in_days"`
}

func generateSecureToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (h *APIKeyHandler) Create(c *gin.Context) {
	var req CreateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orgIDStr, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "organization_id missing"})
		return
	}
	orgID := orgIDStr.(int)

	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user_id missing"})
		return
	}
	userID := userIDStr.(int)

	rawToken := generateSecureToken()
	hash := sha256.Sum256([]byte(rawToken))
	keyHash := hex.EncodeToString(hash[:])

	preview := rawToken[:8] // first 8 chars

	var expiresAt *time.Time
	if req.ExpiresIn != nil {
		t := time.Now().AddDate(0, 0, *req.ExpiresIn)
		expiresAt = &t
	}

	apiKey, err := h.repo.CreateAPIKey(orgID, req.Name, keyHash, preview, req.Scopes, expiresAt, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create API key"})
		return
	}

	// Only return the raw token once!
	c.JSON(http.StatusOK, gin.H{
		"id":         apiKey.ID,
		"name":       apiKey.Name,
		"token":      rawToken, // The user must save this!
		"preview":    apiKey.Preview,
		"scopes":     apiKey.Scopes,
		"expires_at": apiKey.ExpiresAt,
	})
}

func (h *APIKeyHandler) List(c *gin.Context) {
	orgIDStr, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "organization_id missing"})
		return
	}
	orgID := orgIDStr.(int)

	keys, err := h.repo.ListAPIKeys(orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch API keys"})
		return
	}

	c.JSON(http.StatusOK, keys)
}

func (h *APIKeyHandler) Revoke(c *gin.Context) {
	orgIDStr, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "organization_id missing"})
		return
	}
	orgID := orgIDStr.(int)

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid API key ID"})
		return
	}

	err = h.repo.RevokeAPIKey(id, orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not revoke API key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API key revoked successfully"})
}
