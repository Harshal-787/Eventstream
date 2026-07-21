package models

import "time"

type AIConfiguration struct {
	ID             int       `json:"id"`
	OrganizationID int       `json:"organization_id"`
	ProviderType   string    `json:"provider_type"` // "gemini", "openai", "anthropic"
	APIKey         string    `json:"api_key"`
	BaseURL        *string   `json:"base_url"` // Nullable for providers that don't need it
	ModelName      string    `json:"model_name"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
