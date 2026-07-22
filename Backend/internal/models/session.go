package models

import "time"

type Session struct {
	ID           string    `json:"id"`
	UserID       int       `json:"user_id"`
	DeviceInfo   *string   `json:"device_info"`
	IPAddress    *string   `json:"ip_address"`
	IsActive     bool      `json:"is_active"`
	LastActiveAt time.Time `json:"last_active_at"`
	CreatedAt    time.Time `json:"created_at"`
}
