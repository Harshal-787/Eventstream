package models

import (
	"encoding/json"
	"time"
)

type ReportSchedule struct {
	ID             int             `json:"id" db:"id"`
	OrganizationID int             `json:"organization_id" db:"organization_id"`
	ReportType     string          `json:"report_type" db:"report_type"`
	Format         string          `json:"format" db:"format"`
	Frequency      string          `json:"frequency" db:"frequency"`
	Recipients     json.RawMessage `json:"recipients" db:"recipients" swaggertype:"array,string"`
	LastRunAt      *time.Time      `json:"last_run_at" db:"last_run_at"`
	CreatedAt      time.Time       `json:"created_at" db:"created_at"`
	CreatedBy      *int            `json:"created_by" db:"created_by"`
}
