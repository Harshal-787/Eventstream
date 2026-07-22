package main

import (
	"fmt"
	"eventstream/internal/config"
)

func main() {
	cfg := config.Load()
	fmt.Printf("API Key: '%s' (len=%d)\n", cfg.SendGridAPIKey, len(cfg.SendGridAPIKey))
	fmt.Printf("From: '%s'\n", cfg.SendGridFrom)
}
