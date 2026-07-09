package handlers

import (
	"net/http"
	"strconv"

	"eventstream/internal/models"
	"eventstream/internal/repository"

	"github.com/gin-gonic/gin"
)

type BuildingHandler struct {
	buildingRepo *repository.BuildingRepository
}

func NewBuildingHandler(buildingRepo *repository.BuildingRepository) *BuildingHandler {
	return &BuildingHandler{buildingRepo: buildingRepo}
}

type createBuildingRequest struct {
	Name    string `json:"name" binding:"required"`
	Address string `json:"address" binding:"required"`
	City    string `json:"city" binding:"required"`
	State   string `json:"state" binding:"required"`
	ZipCode string `json:"zip_code" binding:"required"`
	OwnerID int    `json:"owner_id"`
}

func (h *BuildingHandler) Create(c *gin.Context) {
	var req createBuildingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetInt("user_id")
	role := c.GetString("user_role")
	
	ownerID := userID
	status := "pending_approval"
	
	if role == "admin" {
		status = "active"
		if req.OwnerID > 0 {
			ownerID = req.OwnerID
		}
	}

	building, err := h.buildingRepo.CreateBuilding(
		req.Name, req.Address, req.City, req.State, req.ZipCode, ownerID, status,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create building"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": building})
}

func (h *BuildingHandler) List(c *gin.Context) {
	role := c.GetString("user_role")
	userID := c.GetInt("user_id")

	var ownerID *int
	if role != "admin" {
		ownerID = &userID
	}

	buildings, err := h.buildingRepo.List(ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch buildings"})
		return
	}
	if buildings == nil {
		buildings = []*models.Building{}
	}

	c.JSON(http.StatusOK, gin.H{"data": buildings})
}

type updateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func (h *BuildingHandler) UpdateStatus(c *gin.Context) {
	role := c.GetString("user_role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "admin only"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req updateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.buildingRepo.UpdateStatus(id, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "status updated"})
}

type updateBuildingRequest struct {
	Name    string `json:"name" binding:"required"`
	Address string `json:"address" binding:"required"`
	City    string `json:"city" binding:"required"`
	State   string `json:"state" binding:"required"`
	ZipCode string `json:"zip_code" binding:"required"`
}

func (h *BuildingHandler) UpdateBuilding(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	role := c.GetString("user_role")
	userID := c.GetInt("user_id")

	existing, err := h.buildingRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "building not found"})
		return
	}

	if role != "admin" && (existing.OwnerID == nil || *existing.OwnerID != userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	var req updateBuildingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.buildingRepo.UpdateBuilding(id, req.Name, req.Address, req.City, req.State, req.ZipCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update building"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "building updated"})
}

func (h *BuildingHandler) Delete(c *gin.Context) {
	role := c.GetString("user_role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "admin only"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	err = h.buildingRepo.DeleteBuilding(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete building"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "building deleted"})
}
