package handlers

import (
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"eventstream/internal/config"
	"eventstream/internal/middleware"
	"eventstream/internal/repository"

	"eventstream/internal/services"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	userRepo     *repository.UserRepository
	buildingRepo *repository.BuildingRepository
	cfg          *config.Config
	emailService *services.EmailService
}

func NewAuthHandler(userRepo *repository.UserRepository, buildingRepo *repository.BuildingRepository, emailService *services.EmailService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{userRepo: userRepo, buildingRepo: buildingRepo, emailService: emailService, cfg: cfg}
}

type registerBuilding struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	City    string `json:"city"`
	State   string `json:"state"`
	ZipCode string `json:"zip_code"`
}

type registerRequest struct {
	Name      string             `json:"name" binding:"required"`
	Email     string             `json:"email" binding:"required,email"`
	Password  string             `json:"password" binding:"required,min=6"`
	Buildings []registerBuilding `json:"buildings"`
}

// Register godoc
// @Summary      Register a new user
// @Description  Creates a new user account with role 'user'
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body registerRequest true "Register payload"
// @Success      201  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]string
// @Failure      409  {object}  map[string]string
// @Router       /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existing, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if existing != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process password"})
		return
	}

	user, err := h.userRepo.CreateUser(req.Name, req.Email, string(hash), "pending_approval")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create user"})
		return
	}

	for _, b := range req.Buildings {
		_, err := h.buildingRepo.CreateBuilding(b.Name, b.Address, b.City, b.State, b.ZipCode, user.ID, "pending_approval")
		if err != nil {
			// Ideally this should be a transaction, but for now we just log/continue or return error
			// The user is created, buildings may partially fail.
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful. Please wait for an Admin to approve your account.",
		"user": gin.H{
			"id":     user.ID,
			"name":   user.Name,
			"email":  user.Email,
			"role":   user.Role,
			"status": user.Status,
		},
	})
}

// Reapply godoc
// @Summary      Reapply for an account
// @Description  Re-submits user info if previously rejected
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body registerRequest true "Reapply payload"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Router       /auth/reapply [post]
func (h *AuthHandler) Reapply(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	// Update user name and reset status to pending_approval
	err = h.userRepo.UpdateUserInfo(user.ID, req.Name, "pending_approval")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update user"})
		return
	}

	// Delete old buildings and insert new ones
	err = h.buildingRepo.DeleteByOwnerID(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not clear old buildings"})
		return
	}

	for _, b := range req.Buildings {
		_, _ = h.buildingRepo.CreateBuilding(b.Name, b.Address, b.City, b.State, b.ZipCode, user.ID, "pending_approval")
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Re-application successful. Please wait for an Admin to approve.",
	})
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Login godoc
// @Summary      Login
// @Description  Authenticates a user and returns a JWT token
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body loginRequest true "Login payload"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if user.Status == "pending_approval" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account pending Admin approval."})
		return
	}

	if user.Status == "rejected" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account registration rejected by Administrator.", "status": "rejected"})
		return
	}

	buildings, err := h.buildingRepo.List(&user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	for _, b := range buildings {
		if b.Status == "pending_approval" {
			c.JSON(http.StatusForbidden, gin.H{"error": "One or more of your buildings are pending Admin approval."})
			return
		}
		if b.Status == "rejected" {
			c.JSON(http.StatusForbidden, gin.H{"error": "One or more of your buildings were rejected by Administrator.", "status": "rejected"})
			return
		}
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if user.Role == "user" {
		// Generate 6-digit OTP
		otpCode := fmt.Sprintf("%06d", rand.Intn(1000000))
		expiresAt := time.Now().Add(10 * time.Minute).Format(time.RFC3339)

		err := h.userRepo.SaveOTP(user.ID, otpCode, expiresAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate OTP"})
			return
		}

		err = h.emailService.SendOTP(user.Email, otpCode)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not send OTP email"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"require_otp": true,
			"email":       user.Email,
			"message":     "OTP sent to your email",
		})
		return
	}

	// Admin login proceeds directly
	token, err := middleware.GenerateToken(user.ID, user.Email, user.Role, h.cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// Me godoc
// @Summary      Get current user
// @Description  Returns the authenticated user's profile
// @Tags         Auth
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  map[string]interface{}
// @Failure      401  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Router       /auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	userID := c.GetInt("user_id")

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":         user.ID,
		"name":       user.Name,
		"email":      user.Email,
		"role":       user.Role,
		"created_at": user.CreatedAt,
	})
}

type verifyOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
	OTP   string `json:"otp" binding:"required"`
}

// VerifyOTP godoc
// @Summary      Verify OTP
// @Description  Verifies the OTP and returns a JWT token
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body verifyOTPRequest true "Verify OTP payload"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Router       /auth/verify-otp [post]
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req verifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if user == nil || user.OTPCode == nil || user.OTPExpiresAt == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid OTP or email"})
		return
	}

	if *user.OTPCode != req.OTP {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid OTP code"})
		return
	}

	if time.Now().After(*user.OTPExpiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "OTP has expired"})
		return
	}

	// OTP is valid
	h.userRepo.ClearOTP(user.ID)

	token, err := middleware.GenerateToken(user.ID, user.Email, user.Role, h.cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}
