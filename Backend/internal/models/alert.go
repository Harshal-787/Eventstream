package models

import "time"

type Building struct {
	ID             int       `json:"id"`
	OrganizationID int       `json:"organization_id"`
	Name           string    `json:"name"`
	Address        string    `json:"address"`
	City           string    `json:"city"`
	State          string    `json:"state"`
	ZipCode        string    `json:"zip_code"`
	Latitude       *float64  `json:"latitude"`
	Longitude      *float64  `json:"longitude"`
	UBID           *string   `json:"ubid"`
	ParcelNumber   *string   `json:"parcel_number"`
	BIN            *string   `json:"bin"`
	OwnerID        *int      `json:"owner_id"`
	Status         string    `json:"status"` // 'pending_approval', 'active', 'suspended'
	IsMaintenance  bool      `json:"is_maintenance"`
	CreatedAt      time.Time `json:"created_at"`
	
	// Joined fields
	OwnerName string `json:"owner_name,omitempty"`
}


type Alert struct {
	ID             int        `json:"id"`
	OrganizationID int        `json:"organization_id"`
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
	HardwareID   string `json:"hardware_id,omitempty"`
	ModelName    string `json:"model_name,omitempty"`
	FloorName    string `json:"floor_name,omitempty"`
	RoomName     string `json:"room_name,omitempty"`
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
