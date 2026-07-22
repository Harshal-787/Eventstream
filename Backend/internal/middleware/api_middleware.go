package middleware

import (
	"crypto/sha256"
	"encoding/hex"
	"eventstream/internal/repository"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// APIKeyAuthMiddleware checks for Bearer <token> and verifies the API key.
// It sets organization_id and api_key_scopes in the context.
func APIKeyAuthMiddleware(apiKeyRepo *repository.APIKeyRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing Authorization header"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid Authorization format, use Bearer <token>"})
			return
		}

		token := parts[1]
		
		// Hash the provided token
		hash := sha256.Sum256([]byte(token))
		keyHash := hex.EncodeToString(hash[:])

		apiKey, err := apiKeyRepo.GetAPIKeyByHash(keyHash)
		if err != nil || apiKey == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or inactive API key"})
			return
		}

		// Optionally check expiration
		if apiKey.ExpiresAt != nil && apiKey.ExpiresAt.Before(time.Now()) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "API key expired"})
			return
		}

		// Debounce last used at update to prevent excessive DB writes
		// Here we'll just do it asynchronously for speed, or let a separate worker handle it.
		// For now, we omit it or do a simple non-blocking call
		go func() {
			_ = apiKeyRepo.UpdateLastUsed(apiKey.ID)
		}()

		// Set context variables
		c.Set("organization_id", apiKey.OrganizationID)
		c.Set("api_key_id", apiKey.ID)
		c.Set("api_key_scopes", apiKey.Scopes)
		c.Set("auth_method", "api_key")

		c.Next()
	}
}
