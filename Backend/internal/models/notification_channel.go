package models

import "time"

type NotificationChannel struct {
	ID             int       `json:"id"`
	OrganizationID int       `json:"organization_id"`
	Name           string    `json:"name"`
	Type           string    `json:"type"` // slack, teams, webhook, sms
	WebhookURL     string    `json:"webhook_url"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
