package models

import (
	"encoding/json"
	"time"
)

type AuditLog struct {
	ID             int                    `json:"id"`
	OrganizationID int                    `json:"organization_id"`
	UserID         *int                   `json:"user_id"`
	UserName       *string                `json:"user_name,omitempty"` // For joining with users table
	UserRole   *string                `json:"user_role,omitempty"`
	Action     string                 `json:"action"`
	EntityType *string                `json:"entity_type"`
	EntityID   *int                   `json:"entity_id"`
	Details    map[string]interface{} `json:"details"`
	IPAddress  *string                `json:"ip_address"`
	CreatedAt  time.Time              `json:"created_at"`
}

// Helper to handle JSONB scanning
func (a *AuditLog) SetDetailsFromJSONB(data []byte) error {
	if data == nil {
		a.Details = make(map[string]interface{})
		return nil
	}
	return json.Unmarshal(data, &a.Details)
}
