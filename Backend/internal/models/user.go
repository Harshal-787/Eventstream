package models

import "time"

type User struct {
	ID             int        `json:"id"`
	Name           string     `json:"name"`
	Email          string     `json:"email"`
	PasswordHash   string     `json:"-"`
	Role           string     `json:"role"`
	Status         string     `json:"status"` // 'pending_approval', 'active'
	ContactNumber  *string    `json:"contact_number"`
	DrivingLicense *string    `json:"driving_license"`
	OTPCode        *string    `json:"-"`
	OTPExpiresAt   *time.Time `json:"-"`
	CreatedAt      time.Time  `json:"created_at"`
}
