package models

import (
	"encoding/json"
	"time"
)

type FailedEvent struct {
	ID             int             `json:"id"`
	OrganizationID *int            `json:"organization_id"`
	Payload        json.RawMessage `json:"payload"`
	ErrorReason    string          `json:"error_reason"`
	SourceIP    string          `json:"source_ip"`
	CreatedAt   time.Time       `json:"created_at"`
}
