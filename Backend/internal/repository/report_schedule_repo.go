package repository

import (
	"database/sql"
	"eventstream/internal/models"
)

type ReportScheduleRepo struct {
	DB *sql.DB
}

func NewReportScheduleRepo(db *sql.DB) *ReportScheduleRepo {
	return &ReportScheduleRepo{DB: db}
}

func (r *ReportScheduleRepo) Create(schedule *models.ReportSchedule) error {
	query := `
		INSERT INTO report_schedules (organization_id, report_type, format, frequency, recipients, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	return r.DB.QueryRow(query,
		schedule.OrganizationID,
		schedule.ReportType,
		schedule.Format,
		schedule.Frequency,
		schedule.Recipients,
		schedule.CreatedBy,
	).Scan(&schedule.ID, &schedule.CreatedAt)
}

func (r *ReportScheduleRepo) GetAllByOrg(orgID int) ([]models.ReportSchedule, error) {
	query := `
		SELECT id, organization_id, report_type, format, frequency, recipients, last_run_at, created_at, created_by
		FROM report_schedules
		WHERE organization_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.DB.Query(query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []models.ReportSchedule
	for rows.Next() {
		var s models.ReportSchedule
		if err := rows.Scan(
			&s.ID, &s.OrganizationID, &s.ReportType, &s.Format,
			&s.Frequency, &s.Recipients, &s.LastRunAt, &s.CreatedAt, &s.CreatedBy,
		); err != nil {
			return nil, err
		}
		schedules = append(schedules, s)
	}
	return schedules, nil
}

func (r *ReportScheduleRepo) GetAll() ([]models.ReportSchedule, error) {
	query := `
		SELECT id, organization_id, report_type, format, frequency, recipients, last_run_at, created_at, created_by
		FROM report_schedules
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []models.ReportSchedule
	for rows.Next() {
		var s models.ReportSchedule
		if err := rows.Scan(
			&s.ID, &s.OrganizationID, &s.ReportType, &s.Format,
			&s.Frequency, &s.Recipients, &s.LastRunAt, &s.CreatedAt, &s.CreatedBy,
		); err != nil {
			return nil, err
		}
		schedules = append(schedules, s)
	}
	return schedules, nil
}

func (r *ReportScheduleRepo) UpdateLastRun(id int) error {
	query := `UPDATE report_schedules SET last_run_at = CURRENT_TIMESTAMP WHERE id = $1`
	_, err := r.DB.Exec(query, id)
	return err
}

func (r *ReportScheduleRepo) Delete(id int, orgID int) error {
	query := `DELETE FROM report_schedules WHERE id = $1 AND organization_id = $2`
	_, err := r.DB.Exec(query, id, orgID)
	return err
}
