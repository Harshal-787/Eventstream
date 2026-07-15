package handlers

import (
	"eventstream/internal/repository"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SearchHandler struct {
	repo *repository.SearchRepository
}

func NewSearchHandler(repo *repository.SearchRepository) *SearchHandler {
	return &SearchHandler{repo: repo}
}

func (h *SearchHandler) GlobalSearch(c *gin.Context) {
	orgIDStr, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "organization_id missing"})
		return
	}
	orgID := orgIDStr.(int)

	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}

	results, err := h.repo.GlobalSearch(orgID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed", "details": err.Error()})
		return
	}

	if results == nil {
		results = []repository.SearchResult{} // return empty array instead of null
	}

	c.JSON(http.StatusOK, results)
}
