package main

import (
	"log"

	"eventstream/internal/config"
	"eventstream/internal/database"
	"eventstream/internal/handlers"
	"eventstream/internal/middleware"
	"eventstream/internal/repository"
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

	authHandler  := handlers.NewAuthHandler(userRepo, cfg)
	alertHandler := handlers.NewAlertHandler(alertRepo)

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
			auth.GET("/me", middleware.AuthMiddleware(cfg), authHandler.Me)
		}

		alertRoutes := v1.Group("/alerts", middleware.AuthMiddleware(cfg))
		{
			alertRoutes.GET("",          alertHandler.List)
			alertRoutes.GET("/:id",      alertHandler.Get)
			alertRoutes.POST("/:id/acknowledge", alertHandler.Acknowledge)
			alertRoutes.POST("/:id/resolve",     alertHandler.Resolve)
		}
	}

	log.Printf("server starting on port %s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
