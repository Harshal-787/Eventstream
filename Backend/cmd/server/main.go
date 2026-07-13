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
	emailService := services.NewEmailService(cfg)

	// Initialize Event Hub for SSE
	hub := events.NewHub()
	go hub.Run()

	authHandler  := handlers.NewAuthHandler(userRepo, buildingRepo, emailService, cfg)
	alertHandler := handlers.NewAlertHandler(alertRepo, hub)
	buildingHandler := handlers.NewBuildingHandler(buildingRepo)
	usersHandler := handlers.NewUsersHandler(userRepo)
	addressHandler := handlers.NewAddressHandler(cfg)
	deviceHandler := handlers.NewDeviceHandler(deviceRepo)

	// Start Virtual Sensor Simulator
	sim := simulator.NewSimulator(db, hub)
	go sim.Run()

	streamHandler := handlers.NewStreamHandler(hub)

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Swagger UI
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/verify-otp", authHandler.VerifyOTP)
			auth.POST("/reapply", authHandler.Reapply)
			auth.GET("/me", middleware.AuthMiddleware(cfg), authHandler.Me)
		}

		addressRoutes := v1.Group("/address")
		{
			addressRoutes.GET("/autocomplete", addressHandler.Autocomplete)
		}

		v1.GET("/stream", middleware.AuthMiddleware(cfg), streamHandler.StreamTelemetry)

		alertRoutes := v1.Group("/alerts", middleware.AuthMiddleware(cfg))
		{
			alertRoutes.GET("",          alertHandler.List)
			alertRoutes.GET("/:id",      alertHandler.Get)
			alertRoutes.POST("/:id/acknowledge", alertHandler.Acknowledge)
			alertRoutes.POST("/:id/resolve",     alertHandler.Resolve)
			alertRoutes.DELETE("/clear", alertHandler.ClearAll)
			alertRoutes.DELETE("/:id", alertHandler.Delete)
		}

		buildingRoutes := v1.Group("/buildings", middleware.AuthMiddleware(cfg))
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

		floorRoutes := v1.Group("/floors", middleware.AuthMiddleware(cfg))
		{
			floorRoutes.GET("/:id/rooms", deviceHandler.GetRooms)
			floorRoutes.POST("/:id/rooms", deviceHandler.CreateRoom)
			floorRoutes.PATCH("/:id", deviceHandler.UpdateFloor)
			floorRoutes.DELETE("/:id", deviceHandler.DeleteFloor)
		}

		roomRoutes := v1.Group("/rooms", middleware.AuthMiddleware(cfg))
		{
			roomRoutes.PATCH("/:id", deviceHandler.UpdateRoom)
			roomRoutes.DELETE("/:id", deviceHandler.DeleteRoom)
		}

		deviceRoutes := v1.Group("/devices", middleware.AuthMiddleware(cfg))
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

		sensorRequestRoutes := v1.Group("/sensor-requests", middleware.AuthMiddleware(cfg))
		{
			sensorRequestRoutes.GET("", deviceHandler.ListSensorRequests)
			sensorRequestRoutes.POST("", deviceHandler.CreateSensorRequest)
			sensorRequestRoutes.POST("/:id/fulfill", deviceHandler.FulfillSensorRequest)
			sensorRequestRoutes.DELETE("/:id", deviceHandler.DeleteSensorRequest)
		}

		userRoutes := v1.Group("/users", middleware.AuthMiddleware(cfg))
		{
			userRoutes.GET("", usersHandler.List)
			userRoutes.PATCH("/:id", usersHandler.UpdateUser)
			userRoutes.PATCH("/:id/status", usersHandler.UpdateStatus)
			userRoutes.DELETE("/:id", usersHandler.Delete)
		}
	}

	log.Printf("server starting on port %s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
