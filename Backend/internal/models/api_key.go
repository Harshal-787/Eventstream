package models

import (
	"time"
)

type APIKey struct {
	ID             int        `json:"id"`
	OrganizationID int        `json:"organization_id"`
	Name           string     `json:"name"`
	KeyHash        string     `json:"-"`
	Preview        string     `json:"preview"`
	Scopes         []string   `json:"scopes"`
	IsActive       bool       `json:"is_active"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"`
	LastUsedAt     *time.Time `json:"last_used_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	CreatedBy      *int       `json:"created_by,omitempty"`
}
