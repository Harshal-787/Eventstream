package models

import "time"

type EscalationPolicy struct {
	ID                    int       `json:"id"`
	OrganizationID        int       `json:"organization_id"`
	Name                  string    `json:"name"`
	WaitMinutes           int       `json:"wait_minutes"`
	NotificationChannelID int       `json:"notification_channel_id"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}
