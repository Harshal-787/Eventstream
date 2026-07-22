package models

import "time"

type Building struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	City      string    `json:"city"`
	State     string    `json:"state"`
	ZipCode   string    `json:"zip_code"`
	OwnerID   *int      `json:"owner_id"`
	Status    string    `json:"status"` // 'pending_approval', 'active', 'suspended'
	CreatedAt time.Time `json:"created_at"`
}

type Device struct {
	ID         int       `json:"id"`
	Name       string    `json:"name"`
	Type       string    `json:"type"`
	BuildingID *int      `json:"building_id"`
	Floor      string    `json:"floor"`
	Room       string    `json:"room"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type AlertRule struct {
	ID         int       `json:"id"`
	Name       string    `json:"name"`
	DeviceType string    `json:"device_type"`
	Metric     string    `json:"metric"`
	Operator   string    `json:"operator"`
	Threshold  *float64  `json:"threshold"`
	BoolValue  *bool     `json:"bool_value"`
	Severity   string    `json:"severity"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
}

type Alert struct {
	ID             int        `json:"id"`
	DeviceID       *int       `json:"device_id"`
	AlertRuleID    *int       `json:"alert_rule_id"`
	Type           string     `json:"type"`
	Severity       string     `json:"severity"`
	Status         string     `json:"status"`
	Message        string     `json:"message"`
	TriggeredAt    time.Time  `json:"triggered_at"`
	AcknowledgedAt *time.Time `json:"acknowledged_at"`
	ResolvedAt     *time.Time `json:"resolved_at"`
	// Joined fields
	DeviceName   string `json:"device_name,omitempty"`
	BuildingName string `json:"building_name,omitempty"`
}

type AlertActivityLog struct {
	ID        int       `json:"id"`
	AlertID   int       `json:"alert_id"`
	UserID    *int      `json:"user_id"`
	Action    string    `json:"action"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"created_at"`
	// Joined fields
	UserName string `json:"user_name,omitempty"`
}
