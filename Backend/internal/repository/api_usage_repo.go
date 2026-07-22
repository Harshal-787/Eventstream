package repository

import (
	"database/sql"
	"eventstream/internal/models"
)

type APIUsageRepository struct {
	db *sql.DB
}

func NewAPIUsageRepository(db *sql.DB) *APIUsageRepository {
	return &APIUsageRepository{db: db}
}

func (r *APIUsageRepository) LogRequest(log *models.APILog) error {
	query := `
		INSERT INTO api_logs (organization_id, api_key_id, endpoint, method, status_code, duration_ms, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	var apiKeyID *int
	if log.APIKeyID != 0 {
		apiKeyID = &log.APIKeyID
	}
	_, err := r.db.Exec(query, log.OrganizationID, apiKeyID, log.Endpoint, log.Method, log.StatusCode, log.DurationMs, log.IPAddress, log.UserAgent)
	return err
}

func (r *APIUsageRepository) GetLogs(orgID int, limit int) ([]models.APILog, error) {
	query := `
		SELECT id, organization_id, COALESCE(api_key_id, 0), endpoint, method, status_code, duration_ms, ip_address, user_agent, created_at
		FROM api_logs
		WHERE organization_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := r.db.Query(query, orgID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.APILog
	for rows.Next() {
		var l models.APILog
		if err := rows.Scan(&l.ID, &l.OrganizationID, &l.APIKeyID, &l.Endpoint, &l.Method, &l.StatusCode, &l.DurationMs, &l.IPAddress, &l.UserAgent, &l.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}
