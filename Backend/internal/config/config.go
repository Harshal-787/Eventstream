package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost         string
	DBPort         string
	DBUser         string
	DBPass         string
	DBName         string
	DBSSLMode      string
	JWTSecret      string
	JWTExpiryHours int
	ServerPort     string
	SendGridAPIKey string
	SendGridFrom   string
	GeoapifyAPIKey string
}

func Load() *Config {
	if err := godotenv.Overload(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	expiryHours, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))

	return &Config{
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPass:         getEnv("DB_PASS", ""),
		DBName:         getEnv("DB_NAME", "eventstream_db"),
		DBSSLMode:      getEnv("DB_SSLMODE", "disable"),
		JWTSecret:      getEnv("JWT_SECRET", "change-me"),
		JWTExpiryHours: expiryHours,
		ServerPort:     getEnv("SERVER_PORT", "8080"),
		SendGridAPIKey: getEnv("SENDGRID_API_KEY", ""),
		SendGridFrom:   getEnv("SENDGRID_FROM_EMAIL", "no-reply@yourdomain.com"),
		GeoapifyAPIKey: getEnv("GEOAPIFY_API_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
