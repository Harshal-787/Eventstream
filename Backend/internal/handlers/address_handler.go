package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"

	"eventstream/internal/config"
)

type AddressHandler struct {
	cfg *config.Config
}

func NewAddressHandler(cfg *config.Config) *AddressHandler {
	return &AddressHandler{
		cfg: cfg,
	}
}

// Autocomplete securely proxies the request to Geoapify API
func (h *AddressHandler) Autocomplete(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}

	if h.cfg.GeoapifyAPIKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Geoapify API key is not configured on the server"})
		return
	}

	// Build the Geoapify URL
	// Restricting to India with filter=countrycode:in
	geoapifyURL := "https://api.geoapify.com/v1/geocode/autocomplete?text=" + url.QueryEscape(query) + "&apiKey=" + h.cfg.GeoapifyAPIKey + "&format=json&filter=countrycode:in&limit=5"

	// Make the HTTP GET request
	resp, err := http.Get(geoapifyURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to contact address service"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusBadGateway, gin.H{"error": "address service returned an error"})
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read response from address service"})
		return
	}

	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse response from address service"})
		return
	}

	c.JSON(http.StatusOK, data)
}
