package models

import "time"

type APILog struct {
	ID             int       `json:"id"`
	OrganizationID int       `json:"organization_id"`
	APIKeyID       int       `json:"api_key_id"`
	Endpoint       string    `json:"endpoint"`
	Method         string    `json:"method"`
	StatusCode     int       `json:"status_code"`
	DurationMs     int       `json:"duration_ms"`
	IPAddress      string    `json:"ip_address"`
	UserAgent      string    `json:"user_agent"`
	CreatedAt      time.Time `json:"created_at"`
}
