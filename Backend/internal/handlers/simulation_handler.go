package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SimulationHandler struct {
	DB *sql.DB
}

func NewSimulationHandler(db *sql.DB) *SimulationHandler {
	return &SimulationHandler{DB: db}
}

func (h *SimulationHandler) GetStatus(c *gin.Context) {
	var isEnabled bool
	err := h.DB.QueryRow("SELECT is_enabled FROM feature_flags WHERE feature_key = 'simulation_active' AND organization_id IS NULL LIMIT 1").Scan(&isEnabled)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusOK, gin.H{"simulation_active": false})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch simulation status"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"simulation_active": isEnabled})
}

func (h *SimulationHandler) ToggleStatus(c *gin.Context) {
	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	_, err := h.DB.Exec("UPDATE feature_flags SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE feature_key = 'simulation_active' AND organization_id IS NULL", req.Enabled)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update simulation status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Simulation status updated successfully", "simulation_active": req.Enabled})
}
