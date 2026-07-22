package middleware

import (
	"bytes"
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

type responseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (r responseBodyWriter) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

func APILoggerMiddleware(repo *repository.APIUsageRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		w := &responseBodyWriter{body: &bytes.Buffer{}, ResponseWriter: c.Writer}
		c.Writer = w

		c.Next()

		duration := time.Since(start).Milliseconds()

		// Extract org ID and api key ID if present
		orgID, _ := c.Get("organization_id")
		apiKeyID, _ := c.Get("api_key_id")

		var orgIDInt, apiKeyIDInt int
		if orgID != nil {
			orgIDInt = orgID.(int)
		} else {
			// Don't log if we can't tie it to an organization
			return
		}
		if apiKeyID != nil {
			apiKeyIDInt = apiKeyID.(int)
		}

		apiLog := &models.APILog{
			OrganizationID: orgIDInt,
			APIKeyID:       apiKeyIDInt,
			Endpoint:       c.Request.URL.Path,
			Method:         c.Request.Method,
			StatusCode:     c.Writer.Status(),
			DurationMs:     int(duration),
			IPAddress:      c.ClientIP(),
			UserAgent:      c.Request.UserAgent(),
		}

		// Log asynchronously
		go func() {
			if err := repo.LogRequest(apiLog); err != nil {
				log.Printf("Failed to log API request: %v", err)
			}
		}()
	}
}
