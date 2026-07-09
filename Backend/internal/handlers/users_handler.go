package handlers

import (
	"net/http"
	"strconv"

	"eventstream/internal/repository"

	"github.com/gin-gonic/gin"
)

type UsersHandler struct {
	userRepo *repository.UserRepository
}

func NewUsersHandler(userRepo *repository.UserRepository) *UsersHandler {
	return &UsersHandler{userRepo: userRepo}
}

func (h *UsersHandler) List(c *gin.Context) {
	role := c.GetString("user_role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "admin only"})
		return
	}

	users, err := h.userRepo.ListUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch users"})
		return
	}

	if users == nil {
		c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": users})
}

type updateUserStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func (h *UsersHandler) UpdateStatus(c *gin.Context) {
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

	var req updateUserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.userRepo.UpdateUserStatus(id, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "status updated"})
}

type updateUserRequest struct {
	Name string `json:"name" binding:"required"`
}

func (h *UsersHandler) UpdateUser(c *gin.Context) {
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

	var req updateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.userRepo.UpdateUserName(id, req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user updated"})
}

func (h *UsersHandler) Delete(c *gin.Context) {
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

	err = h.userRepo.DeleteUser(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deleted"})
}
