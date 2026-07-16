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
	"eventstream/internal/workers"
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

	userRepo := repository.NewUserRepository(db)
	alertRepo := repository.NewAlertRepository(db)
	buildingRepo := repository.NewBuildingRepository(db)
	deviceRepo := repository.NewDeviceRepo(db)
	telemetryRepo := repository.NewTelemetryRepository(db)
	auditRepo := repository.NewAuditLogRepository(db)
	failedEventRepo := repository.NewFailedEventRepository(db)
	ruleRepo := repository.NewAlertRuleRepository(db)
	sessionRepo := repository.NewSessionRepository(db)
	deviceTwinRepo := repository.NewDeviceTwinRepository(db)
	notificationChannelRepo := repository.NewNotificationChannelRepo(db)
	deviceGroupRepo := repository.NewDeviceGroupRepository(db)
	aiConfigRepo := repository.NewAIConfigRepo(db)

	emailService := services.NewEmailService(cfg)
	auditLogger := services.NewAuditLogger(auditRepo)
	notificationService := services.NewNotificationService(notificationChannelRepo)
	alertEngine := services.NewAlertEngine(ruleRepo, alertRepo, deviceRepo, notificationService)
	reportingService := services.NewReportingService(db, telemetryRepo, alertRepo, deviceRepo)
	anomalyDetector := services.NewAnomalyDetector(alertRepo, notificationService)
	telemetryIngestService := services.NewTelemetryIngestService(telemetryRepo, deviceRepo, anomalyDetector, alertEngine)
	aiService := services.NewAIService(aiConfigRepo)

	// Initialize Event Hub for SSE
	hub := events.NewHub()
	go hub.Run()

	authHandler := handlers.NewAuthHandler(userRepo, buildingRepo, sessionRepo, emailService, cfg, auditLogger)
	alertHandler := handlers.NewAlertHandler(alertRepo, hub, auditLogger)
	buildingHandler := handlers.NewBuildingHandler(buildingRepo)
	usersHandler := handlers.NewUsersHandler(userRepo)
	addressHandler := handlers.NewAddressHandler(cfg)
	deviceHandler := handlers.NewDeviceHandler(deviceRepo, auditLogger)
	auditLogHandler := handlers.NewAuditLogHandler(auditRepo)
	telemetryHandler := handlers.NewTelemetryHandler(telemetryIngestService, telemetryRepo, failedEventRepo)
	failedEventHandler := handlers.NewFailedEventHandler(failedEventRepo)
	ruleHandler := handlers.NewAlertRuleHandler(ruleRepo, auditLogger)
	deviceTwinHandler := handlers.NewDeviceTwinHandler(deviceTwinRepo, deviceRepo)
	provisioningHandler := handlers.NewProvisioningHandler(deviceRepo)
	wsIngestHandler := handlers.NewWSIngestHandler(telemetryIngestService, deviceRepo)
	webhookHandler := handlers.NewWebhookHandler(telemetryIngestService, deviceRepo)
	notificationChannelHandler := handlers.NewNotificationChannelHandler(notificationChannelRepo)
	reportHandler := handlers.NewReportHandler(reportingService)
	deviceGroupHandler := handlers.NewDeviceGroupHandler(deviceGroupRepo)
	aiHandler := handlers.NewAIHandler(aiConfigRepo, aiService, alertRepo, telemetryRepo, deviceRepo)

	// Start Background Workers
	heartbeatMonitor := workers.NewHeartbeatMonitor(db, 1*time.Minute)
	heartbeatMonitor.Start()

	// In a real app, MQTT broker URI and client ID would be in config
	mqttWorker := workers.NewMQTTWorker("tcp://localhost:1883", "eventstream-backend", telemetryIngestService, deviceRepo)
	mqttWorker.Start()

	// Start Virtual Sensor Simulator
	sim := simulator.NewSimulator(db, hub, ruleRepo, anomalyDetector, notificationService)
	go sim.Run()

	streamHandler := handlers.NewStreamHandler(hub)

	r := gin.Default()

	// Apply CORS
	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return true
		},
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
			alertRoutes.GET("", alertHandler.List)
			alertRoutes.GET("/:id", alertHandler.Get)
			alertRoutes.POST("/:id/acknowledge", alertHandler.Acknowledge)
			alertRoutes.POST("/:id/resolve", alertHandler.Resolve)
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
			floorRoutes.GET("/:id", deviceHandler.GetFloor)
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
			deviceRoutes.PATCH("/:id/maintenance", deviceHandler.ToggleMaintenance)
			deviceRoutes.DELETE("/:id", deviceHandler.DeleteDevice)
			deviceRoutes.GET("/models", deviceHandler.GetModels)
			deviceRoutes.POST("/models", deviceHandler.CreateModel)
			deviceRoutes.POST("/:id/provision", provisioningHandler.GenerateToken)
			deviceRoutes.GET("/:id/twin", deviceTwinHandler.GetTwin)
			deviceRoutes.PUT("/:id/twin", deviceTwinHandler.UpdateTwin)
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

		failedEventRoutes := v1.Group("/failed-events", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			failedEventRoutes.GET("", failedEventHandler.GetFailedEvents)
		}

		eventRoutes := v1.Group("/events")
		{
			// Legacy Webhook for IoT devices
			eventRoutes.POST("/ingest", telemetryHandler.IngestEvent)

			// Phase 2 Webhook
			eventRoutes.POST("/webhook-ingest", webhookHandler.HandleWebhook)

			// Phase 2 WebSockets
			eventRoutes.GET("/ws/ingest", middleware.AuthMiddleware(cfg, sessionRepo), wsIngestHandler.HandleIngest)

			// Dashboard retrieval
			eventRoutes.GET("", middleware.AuthMiddleware(cfg, sessionRepo), telemetryHandler.GetEvents)
		}

		notificationRoutes := v1.Group("/notification-channels", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			notificationRoutes.GET("", notificationChannelHandler.List)
			notificationRoutes.POST("", notificationChannelHandler.Create)
			notificationRoutes.PUT("/:id", notificationChannelHandler.Update)
			notificationRoutes.DELETE("/:id", notificationChannelHandler.Delete)
		}

		deviceGroupRoutes := v1.Group("/device-groups", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			deviceGroupRoutes.GET("", deviceGroupHandler.List)
			deviceGroupRoutes.POST("", deviceGroupHandler.Create)
			deviceGroupRoutes.DELETE("/:id", deviceGroupHandler.Delete)
			deviceGroupRoutes.POST("/:id/members/:deviceId", deviceGroupHandler.AddMember)
			deviceGroupRoutes.DELETE("/:id/members/:deviceId", deviceGroupHandler.RemoveMember)
		}

		reportRoutes := v1.Group("/reports", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			reportRoutes.GET("/export", reportHandler.ExportReport)
		}

		aiRoutes := v1.Group("/ai", middleware.AuthMiddleware(cfg, sessionRepo))
		{
			aiRoutes.GET("/config", aiHandler.GetConfig)
			aiRoutes.POST("/config", aiHandler.SetConfig)
			aiRoutes.GET("/summary", aiHandler.GenerateEventSummary)
			aiRoutes.GET("/alerts/:id/rca", aiHandler.AnalyzeAlertRCA)
			aiRoutes.GET("/devices/:id/predictive-maintenance", aiHandler.PredictMaintenance)
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
