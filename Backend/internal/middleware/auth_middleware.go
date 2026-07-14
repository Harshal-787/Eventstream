package middleware

import (
	"net/http"
	"time"

	"eventstream/internal/config"
	"eventstream/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID    int    `json:"user_id"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	SessionID string `json:"session_id"`
	jwt.RegisteredClaims
}

func GenerateToken(userID int, email, role, sessionID string, cfg *config.Config) (string, error) {
	claims := Claims{
		UserID:    userID,
		Email:     email,
		Role:      role,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(cfg.JWTExpiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}

func AuthMiddleware(cfg *config.Config, sessionRepo *repository.SessionRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from cookie
		tokenStr, err := c.Cookie("access_token")
		if err != nil || tokenStr == "" {
			// Fallback to query param for EventSource (SSE) which cannot send headers/cookies easily depending on setup
			tokenStr = c.Query("token")
		}

		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization token"})
			return
		}

		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		if claims.SessionID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid session token format"})
			return
		}

		session, err := sessionRepo.GetSession(claims.SessionID)
		if err != nil || session == nil || !session.IsActive {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "session expired or revoked"})
			return
		}

		// Optionally update LastActiveAt (debounced to avoid DB spam, e.g., if older than 5 mins)
		if time.Since(session.LastActiveAt) > 5*time.Minute {
			_ = sessionRepo.UpdateLastActive(session.ID)
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("session_id", claims.SessionID)
		c.Next()
	}
}

func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists || userRole != role {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden: insufficient permissions"})
			return
		}
		c.Next()
	}
}
