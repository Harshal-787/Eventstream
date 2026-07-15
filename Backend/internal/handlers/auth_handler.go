package handlers

import (
	"fmt"
	mathrand "math/rand"
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
	sessionRepo  *repository.SessionRepository
	cfg          *config.Config
	emailService *services.EmailService
	logger       *services.AuditLogger
}

func NewAuthHandler(userRepo *repository.UserRepository, buildingRepo *repository.BuildingRepository, sessionRepo *repository.SessionRepository, emailService *services.EmailService, cfg *config.Config, logger *services.AuditLogger) *AuthHandler {
	return &AuthHandler{userRepo: userRepo, buildingRepo: buildingRepo, sessionRepo: sessionRepo, emailService: emailService, cfg: cfg, logger: logger}
}

type registerBuilding struct {
	Name      string   `json:"name"`
	Address   string   `json:"address"`
	City      string   `json:"city"`
	State     string   `json:"state"`
	ZipCode   string   `json:"zip_code"`
	Latitude  *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`
	UBID      *string  `json:"ubid"`
	ParcelNumber *string `json:"parcel_number"`
	BIN       *string  `json:"bin"`
}

type registerRequest struct {
	Name           string             `json:"name" binding:"required"`
	Email          string             `json:"email" binding:"required,email"`
	Password       string             `json:"password" binding:"required,min=6"`
	ContactNumber  string             `json:"contact_number"`
	DrivingLicense string             `json:"driving_license"`
	Buildings      []registerBuilding `json:"buildings"`
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

	user, err := h.userRepo.CreateUser(req.Name, req.Email, string(hash), "pending_approval", req.ContactNumber, req.DrivingLicense)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create user"})
		return
	}

	for _, b := range req.Buildings {
		_, err := h.buildingRepo.CreateBuilding(b.Name, b.Address, b.City, b.State, b.ZipCode, user.ID, "pending_approval", b.Latitude, b.Longitude, b.UBID, b.ParcelNumber, b.BIN)
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
		_, _ = h.buildingRepo.CreateBuilding(b.Name, b.Address, b.City, b.State, b.ZipCode, user.ID, "pending_approval", b.Latitude, b.Longitude, b.UBID, b.ParcelNumber, b.BIN)
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
		otpCode := fmt.Sprintf("%06d", mathrand.Intn(1000000))
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

	// Create DB Session
	deviceInfo := c.Request.UserAgent()
	ipAddress := c.ClientIP()
	session, err := h.sessionRepo.CreateSession(user.ID, deviceInfo, ipAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create session"})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.OrganizationID, user.Email, user.Role, session.ID, h.cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	entityType := "user"
	h.logger.Log(&user.ID, "USER_LOGGED_IN", &entityType, &user.ID, map[string]interface{}{
		"email": user.Email,
		"role":  user.Role,
	}, c.ClientIP())

	c.SetCookie("access_token", token, h.cfg.JWTExpiryHours*3600, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// Logout godoc
// @Summary      Logout
// @Description  Logs out a user and clears the JWT cookie
// @Tags         Auth
// @Produce      json
// @Success      200  {object}  map[string]string
// @Router       /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	sessionID, exists := c.Get("session_id")
	if exists {
		h.sessionRepo.RevokeSession(sessionID.(string))
	}

	c.SetCookie("access_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
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

// Refresh godoc
// @Summary      Refresh token
// @Description  Silently refreshes the access token if the current one is still valid
// @Tags         Auth
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Router       /auth/refresh [post]
func (h *AuthHandler) Refresh(c *gin.Context) {
	userID := c.GetInt("user_id")

	user, err := h.userRepo.FindByID(userID)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	sessionID, _ := c.Get("session_id")
	token, err := middleware.GenerateToken(user.ID, user.OrganizationID, user.Email, user.Role, sessionID.(string), h.cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	c.SetCookie("access_token", token, h.cfg.JWTExpiryHours*3600, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Token refreshed successfully"})
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

	// Create DB Session
	deviceInfo := c.Request.UserAgent()
	ipAddress := c.ClientIP()
	session, err := h.sessionRepo.CreateSession(user.ID, deviceInfo, ipAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create session"})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.OrganizationID, user.Email, user.Role, session.ID, h.cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	entityType := "user"
	h.logger.Log(&user.ID, "USER_LOGGED_IN", &entityType, &user.ID, map[string]interface{}{
		"email": user.Email,
		"role":  user.Role,
		"method": "otp",
	}, c.ClientIP())

	c.SetCookie("access_token", token, h.cfg.JWTExpiryHours*3600, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "OTP verified successfully",
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

type forgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ForgotPassword godoc
// @Summary      Request password reset
// @Description  Sends a password reset OTP if the account exists
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body forgotPasswordRequest true "Forgot Password payload"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]string
// @Router       /auth/forgot-password [post]
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req forgotPasswordRequest
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
		// Don't leak whether email exists
		c.JSON(http.StatusOK, gin.H{"message": "If an account exists, a reset code has been sent."})
		return
	}

	// Generate 6-digit OTP
	otpCode := fmt.Sprintf("%06d", mathrand.Intn(1000000))
	expiresAt := time.Now().Add(10 * time.Minute).Format(time.RFC3339)

	err = h.userRepo.SaveOTP(user.ID, otpCode, expiresAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save reset code"})
		return
	}

	err = h.emailService.SendOTP(user.Email, otpCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not send email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "If an account exists, a reset code has been sent."})
}

type resetPasswordRequest struct {
	Email    string `json:"email" binding:"required,email"`
	OTP      string `json:"otp" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

// ResetPassword godoc
// @Summary      Reset password
// @Description  Resets password using OTP
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body body resetPasswordRequest true "Reset Password payload"
// @Success      200  {object}  map[string]interface{}
// @Failure      400  {object}  map[string]string
// @Router       /auth/reset-password [post]
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req resetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if user == nil || user.OTPCode == nil || user.OTPExpiresAt == nil || time.Now().After(*user.OTPExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired reset code"})
		return
	}

	if *user.OTPCode != req.OTP {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid reset code"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process password"})
		return
	}

	err = h.userRepo.UpdatePassword(user.ID, string(hash))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update password"})
		return
	}
	
	// Clear the OTP to prevent reuse
	h.userRepo.ClearOTP(user.ID)

	// Revoke all existing active sessions when password resets
	_ = h.sessionRepo.RevokeAllOtherSessions(user.ID, "")

	c.JSON(http.StatusOK, gin.H{"message": "Password has been successfully reset."})
}

// GetActiveSessions godoc
// @Summary      Get Active Sessions
// @Description  Lists all active sessions for the current user
// @Tags         Auth
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  map[string]interface{}
// @Router       /auth/sessions [get]
func (h *AuthHandler) GetActiveSessions(c *gin.Context) {
	userID := c.GetInt("user_id")
	sessions, err := h.sessionRepo.ListActiveSessions(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch sessions"})
		return
	}
	
	currentSessionID, _ := c.Get("session_id")

	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"current_session_id": currentSessionID,
	})
}

// RevokeSession godoc
// @Summary      Revoke Session
// @Description  Revokes a specific session by ID
// @Tags         Auth
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Session ID"
// @Success      200  {object}  map[string]string
// @Router       /auth/sessions/:id [delete]
func (h *AuthHandler) RevokeSession(c *gin.Context) {
	userID := c.GetInt("user_id")
	sessionID := c.Param("id")

	// Verify session belongs to user
	session, err := h.sessionRepo.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch session"})
		return
	}
	if session == nil || session.UserID != userID {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	err = h.sessionRepo.RevokeSession(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not revoke session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session revoked"})
}
