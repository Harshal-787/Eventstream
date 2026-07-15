package models

import "time"

type Floor struct {
	ID           int       `json:"id"`
	BuildingID   int       `json:"building_id"`
	Level        int       `json:"level"`
	Name         string    `json:"name"`
	FloorPlanURL *string   `json:"floor_plan_url,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type Room struct {
	ID        int       `json:"id"`
	FloorID   int       `json:"floor_id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"created_at"`
}

type DeviceModel struct {
	ID                        int       `json:"id"`
	Brand                     string    `json:"brand"`
	ModelName                 string    `json:"model_name"`
	SensorType                string    `json:"sensor_type"`
	HeartbeatInterval         int       `json:"heartbeat_interval"`
	ConnectivityProtocol      *string   `json:"connectivity_protocol"`
	PowerSource               *string   `json:"power_source"`
	ExpectedBatteryLifeMonths *int      `json:"expected_battery_life_months"`
	PayloadDecoder            *string   `json:"payload_decoder"`
	IPRating                  *string   `json:"ip_rating"`
	MinOperatingTemp          *int      `json:"min_operating_temp"`
	MaxOperatingTemp          *int      `json:"max_operating_temp"`
	DocumentationURL          *string   `json:"documentation_url"`
	ImageURL                  *string   `json:"image_url"`
	CreatedAt                 time.Time `json:"created_at"`
}

type Device struct {
	ID                  int        `json:"id"`
	OrganizationID      int        `json:"organization_id"`
	DeviceGroupID       *int       `json:"device_group_id,omitempty"`
	HardwareID          *string    `json:"hardware_id"`
	Name                string     `json:"name"`
	Type                string     `json:"type"`
	ModelID             *int       `json:"model_id"`
	BuildingID          *int       `json:"building_id"`
	FloorID             *int       `json:"floor_id"`
	RoomID              *int       `json:"room_id"`
	Status              string     `json:"status"` // unassigned, active, offline, maintenance, retired
	Metadata            *string    `json:"metadata"` // JSONB as string for simple handling, or map[string]interface{}
	BatteryPct          *int       `json:"battery_pct"`
	SignalStrength      *string    `json:"signal_strength"`
	FirmwareVersion     *string    `json:"firmware_version,omitempty"`
	LastCommunicationAt *time.Time `json:"last_communication_at,omitempty"`
	ActivationStatus    string     `json:"activation_status"` // pending, active, inactive, disabled
	ProvisioningToken   *string    `json:"provisioning_token,omitempty"`
	MapX                *float64   `json:"map_x,omitempty"`
	MapY                *float64   `json:"map_y,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`

	// Joined fields for easier UI rendering
	ModelName    string `json:"model_name,omitempty"`
	Brand        string `json:"brand,omitempty"`
	BuildingName string `json:"building_name,omitempty"`
	FloorName    string `json:"floor_name,omitempty"`
	RoomName     string `json:"room_name,omitempty"`
}

type DeviceGroup struct {
	ID             int       `json:"id"`
	OrganizationID int       `json:"organization_id"`
	Name           string    `json:"name"`
	Description    *string   `json:"description,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type DeviceTwin struct {
	DeviceID      int                    `json:"device_id"`
	DesiredState  map[string]interface{} `json:"desired_state"`
	ReportedState map[string]interface{} `json:"reported_state"`
	Configuration map[string]interface{} `json:"configuration"`
	HealthScore   int                    `json:"health_score"`
	UpdatedAt     time.Time              `json:"updated_at"`
}

type SensorRequest struct {
	ID          int        `json:"id"`
	UserID      int        `json:"user_id"`
	BuildingID  int        `json:"building_id"`
	FloorID     int        `json:"floor_id"`
	RoomID      int        `json:"room_id"`
	SensorType  string     `json:"sensor_type"`
	Reason      string     `json:"reason"`
	Brand       string     `json:"brand"`
	ModelName   string     `json:"model_name"`
	HardwareID  string     `json:"hardware_id"`
	Status      string     `json:"status"` // pending, fulfilled, rejected
	FulfilledBy *int       `json:"fulfilled_by"`
	FulfilledAt *time.Time `json:"fulfilled_at"`
	CreatedAt   time.Time  `json:"created_at"`

	// Joined fields
	UserName     string `json:"user_name,omitempty"`
	BuildingName string `json:"building_name,omitempty"`
	FloorName    string `json:"floor_name,omitempty"`
	RoomName     string `json:"room_name,omitempty"`
}
