package models

import "time"

type AlertRule struct {
	ID         int        `json:"id"`
	Name       string     `json:"name"`
	DeviceType string     `json:"device_type"` // e.g., 'temperature', 'motion'
	Metric     string     `json:"metric"`      // e.g., 'temperature', 'motion_detected'
	Operator   string     `json:"operator"`    // e.g., '>', '<', '==', '!='
	Threshold      *float64   `json:"threshold,omitempty"`
	BoolValue      *bool      `json:"bool_value,omitempty"`
	Severity       string     `json:"severity"` // 'low', 'medium', 'high', 'critical'
	IsActive       bool       `json:"is_active"`
	TargetType     string     `json:"target_type"` // 'global', 'building', 'room', 'device'
	TargetID       *int       `json:"target_id,omitempty"`
	CreatedBy      *int       `json:"created_by,omitempty"`
	CreatedAt      *time.Time `json:"created_at,omitempty"`
	
	// Joined fields for display
	TargetName    *string `json:"target_name,omitempty"`
	CreatedByName *string `json:"created_by_name,omitempty"`
	HardwareID    *string `json:"hardware_id,omitempty"`
	BuildingName  *string `json:"building_name,omitempty"`
	FloorName     *string `json:"floor_name,omitempty"`
	RoomName      *string `json:"room_name,omitempty"`
}
