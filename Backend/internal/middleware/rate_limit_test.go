package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

func TestRateLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a limiter that allows 1 request per second, burst 1
	limiterMiddleware := RateLimit(rate.Limit(1), 1)

	r := gin.New()
	// Set trusted proxies to avoid gin warnings
	r.SetTrustedProxies(nil)
	
	// Inject fake IP for testing
	r.Use(func(c *gin.Context) {
		c.Request.RemoteAddr = "192.168.1.1:12345"
		c.Next()
	})
	r.Use(limiterMiddleware)
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// First request should pass
	req, _ := http.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Second request immediately should fail due to rate limiting
	req2, _ := http.NewRequest(http.MethodGet, "/test", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusTooManyRequests {
		t.Errorf("Expected status %d, got %d", http.StatusTooManyRequests, w2.Code)
	}

	// Wait for 1 second, the token should replenish
	time.Sleep(1100 * time.Millisecond)

	req3, _ := http.NewRequest(http.MethodGet, "/test", nil)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)

	if w3.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d after waiting", http.StatusOK, w3.Code)
	}
}
