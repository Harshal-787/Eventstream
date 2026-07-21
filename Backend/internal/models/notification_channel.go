package models

import (
	"encoding/json"
	"time"
)

type NotificationChannel struct {
	ID             int             `json:"id"`
	OrganizationID int             `json:"organization_id"`
	Name           string          `json:"name"`
	Type           string          `json:"type"` // slack, teams, webhook, sms, email, push
	WebhookURL     string          `json:"webhook_url"`
	Config         json.RawMessage `json:"config,omitempty"`
	IsActive       bool            `json:"is_active"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}
