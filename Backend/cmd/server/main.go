package main

import (
	"log"

	"eventstream/internal/config"
	"eventstream/internal/database"
	"eventstream/internal/events"
	"eventstream/internal/handlers"
	"eventstream/internal/middleware"
	"eventstream/internal/repository"
	"eventstream/internal/services"
	"eventstream/internal/simulator"
	_ "eventstream/docs"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/secure"
	"golang.org/x/time/rate"
	"time"
)

// @title           EventStream Go API
// @version         1.0
// @description     Backend API for EventStream Go — IoT smart building event monitoring platform.
// @host            localhost:8080
// @BasePath        /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Enter: Bearer <your_token>

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Println("connected to database")

	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	userRepo  := repository.NewUserRepository(db)
	alertRepo := repository.NewAlertRepository(db)
	buildingRepo := repository.NewBuildingRepository(db)
	deviceRepo   := repository.NewDeviceRepo(db)
	auditRepo    := repository.NewAuditLogRepository(db)
	telemetryRepo := repository.NewTelemetryRepository(db)
	ruleRepo     := repository.NewAlertRuleRepository(db)
	sessionRepo  := repository.NewSessionRepository(db)

	emailService := services.NewEmailService(cfg)
	auditLogger  := services.NewAuditLogger(auditRepo)

	// Initialize Event Hub for SSE
	hub := events.NewHub()
	go hub.Run()

	authHandler  := handlers.NewAuthHandler(userRepo, buildingRepo, sessionRepo, emailService, cfg, auditLogger)
	alertHandler := handlers.NewAlertHandler(alertRepo, hub, auditLogger)
	buildingHandler := handlers.NewBuildingHandler(buildingRepo)
	usersHandler := handlers.NewUsersHandler(userRepo)
	addressHandler := handlers.NewAddressHandler(cfg)
	deviceHandler := handlers.NewDeviceHandler(deviceRepo, auditLogger)
	auditLogHandler := handlers.NewAuditLogHandler(auditRepo)
	telemetryHandler := handlers.NewTelemetryHandler(telemetryRepo)
	ruleHandler := handlers.NewAlertRuleHandler(ruleRepo, auditLogger)

	// Start Virtual Sensor Simulator
	sim := simulator.NewSimulator(db, hub, ruleRepo)
	go sim.Run()

	streamHandler := handlers.NewStreamHandler(hub)

	r := gin.Default()

	// Apply CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Apply Security Headers
	r.Use(secure.New(secure.Config{
		BrowserXssFilter:   true,
		ContentTypeNosniff: true,
		FrameDeny:          true,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Swagger UI
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			// Limit to 5 requests per second, burst 10
			auth.POST("/register", middleware.RateLimit(rate.Limit(5), 10), authHandler.Register)
			auth.POST("/login", middleware.RateLimit(rate.Limit(5), 10), authHandler.Login)
			auth.POST("/verify-otp", middleware.RateLimit(rate.Limit(5), 10), authHandler.VerifyOTP)
			auth.POST("/reapply", middleware.RateLimit(rate.Limit(5), 10), authHandler.Reapply)
			auth.POST("/forgot-password", middleware.RateLimit(rate.Limit(5), 10), authHandler.ForgotPassword)
			auth.POST("/reset-password", middleware.RateLimit(rate.Limit(5), 10), authHandler.ResetPassword)
			auth.POST("/logout", authHandler.Logout) // We'll need a logout handler to clear cookie
			auth.GET("/me", middleware.AuthMiddleware(cfg, sessionRepo), authHandler.Me)
			auth.POST("/refresh", middleware.AuthMiddleware(cfg, sessionRepo), authHandler.Refresh)
			auth.GET("/sessions", middleware.AuthMiddleware(cfg, sessionRepo), authHandler.GetActiveSessions)
			auth.DELETE("/sessions/:id", middleware.AuthMiddleware(cfg, sessionRepo), authHandler.RevokeSession)
		}

		addressRoutes := v1.Group("/address")
		{
			addressRoutes.GET("/autocomplete", addressHandler.Autocomplete)
		}

		v1.GET("/stream", middleware.AuthMiddleware(cfg, sessionRepo), streamHandler.StreamTelemetry)

		alertRoutes := v1.Group("/alerts", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			alertRoutes.GET("",          alertHandler.List)
			alertRoutes.GET("/:id",      alertHandler.Get)
			alertRoutes.POST("/:id/acknowledge", alertHandler.Acknowledge)
			alertRoutes.POST("/:id/resolve",     alertHandler.Resolve)
			alertRoutes.DELETE("/clear", alertHandler.ClearAll)
			alertRoutes.DELETE("/:id", alertHandler.Delete)
		}

		buildingRoutes := v1.Group("/buildings", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			buildingRoutes.GET("", buildingHandler.List)
			buildingRoutes.GET("/:id", buildingHandler.Get)
			buildingRoutes.POST("", buildingHandler.Create)
			buildingRoutes.PATCH("/:id", buildingHandler.UpdateBuilding)
			buildingRoutes.PATCH("/:id/status", buildingHandler.UpdateStatus)
			buildingRoutes.DELETE("/:id", buildingHandler.Delete)
			
			buildingRoutes.GET("/:id/floors", deviceHandler.GetFloors)
			buildingRoutes.POST("/:id/floors", deviceHandler.CreateFloor)
		}

		floorRoutes := v1.Group("/floors", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			floorRoutes.GET("/:id/rooms", deviceHandler.GetRooms)
			floorRoutes.POST("/:id/rooms", deviceHandler.CreateRoom)
			floorRoutes.PATCH("/:id", deviceHandler.UpdateFloor)
			floorRoutes.DELETE("/:id", deviceHandler.DeleteFloor)
		}

		roomRoutes := v1.Group("/rooms", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			roomRoutes.PATCH("/:id", deviceHandler.UpdateRoom)
			roomRoutes.DELETE("/:id", deviceHandler.DeleteRoom)
		}

		deviceRoutes := v1.Group("/devices", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			deviceRoutes.GET("", deviceHandler.ListDevices)
			deviceRoutes.POST("", deviceHandler.CreateDevice)
			deviceRoutes.POST("/bulk", deviceHandler.BulkCreateDevices)
			deviceRoutes.PATCH("/:id/assign", deviceHandler.AssignDevice)
			deviceRoutes.PATCH("/:id/status", deviceHandler.UpdateDeviceStatus)
			deviceRoutes.DELETE("/:id", deviceHandler.DeleteDevice)
			deviceRoutes.GET("/models", deviceHandler.GetModels)
			deviceRoutes.POST("/models", deviceHandler.CreateModel)
		}

		sensorRequestRoutes := v1.Group("/sensor-requests", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			sensorRequestRoutes.GET("", deviceHandler.ListSensorRequests)
			sensorRequestRoutes.POST("", deviceHandler.CreateSensorRequest)
			sensorRequestRoutes.POST("/:id/fulfill", deviceHandler.FulfillSensorRequest)
			sensorRequestRoutes.DELETE("/:id", deviceHandler.DeleteSensorRequest)
		}

		userRoutes := v1.Group("/users", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			userRoutes.GET("", usersHandler.List)
			userRoutes.PATCH("/:id", usersHandler.UpdateUser)
			userRoutes.PATCH("/:id/status", usersHandler.UpdateStatus)
			userRoutes.DELETE("/:id", usersHandler.Delete)
		}

		auditLogRoutes := v1.Group("/audit-logs", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			auditLogRoutes.GET("", auditLogHandler.GetLogs)
		}

		eventRoutes := v1.Group("/events", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			eventRoutes.GET("", telemetryHandler.GetEvents)
		}

		ruleRoutes := v1.Group("/alert-rules", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			ruleRoutes.GET("", ruleHandler.List)
			ruleRoutes.POST("", middleware.RequireRole("admin"), ruleHandler.Create)
			ruleRoutes.PUT("/:id", middleware.RequireRole("admin"), ruleHandler.Update)
			ruleRoutes.DELETE("/:id", middleware.RequireRole("admin"), ruleHandler.Delete)
		}
	}

	log.Printf("server starting on port %s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
