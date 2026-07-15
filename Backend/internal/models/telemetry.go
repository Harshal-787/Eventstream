package models

import "time"

type Telemetry struct {
	ID             int       `json:"id"`
	OrganizationID int       `json:"organization_id"`
	DeviceID       int       `json:"device_id"`
	Temperature *float64               `json:"temperature"`
	Humidity    *float64               `json:"humidity"`
	Status      *string                `json:"status"`
	Payload     map[string]interface{} `json:"payload,omitempty"`
	Timestamp   time.Time              `json:"timestamp"`
}
