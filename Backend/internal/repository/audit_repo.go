package repository

import (
	"database/sql"
	"encoding/json"
	"eventstream/internal/models"
)

type AuditRepository struct {
	db *sql.DB
}

func NewAuditRepository(db *sql.DB) *AuditRepository {
	return &AuditRepository{db: db}
}

func (r *AuditRepository) CreateLog(orgID int, userID *int, action, entityType string, entityID *int, details map[string]interface{}, ipAddress string) error {
	var detailsBytes []byte
	if details != nil {
		var err error
		detailsBytes, err = json.Marshal(details)
		if err != nil {
			return err
		}
	}

	query := `
		INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, details, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.Exec(query, orgID, userID, action, entityType, entityID, detailsBytes, ipAddress)
	return err
}

func (r *AuditRepository) ListLogs(orgID int, limit, offset int) ([]*models.AuditLog, error) {
	query := `
		SELECT id, organization_id, user_id, action, entity_type, entity_id, details, ip_address, created_at
		FROM audit_logs
		WHERE organization_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.db.Query(query, orgID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*models.AuditLog
	for rows.Next() {
		log := &models.AuditLog{}
		var detailsBytes []byte
		err := rows.Scan(
			&log.ID, &log.OrganizationID, &log.UserID, &log.Action, &log.EntityType, &log.EntityID, &detailsBytes, &log.IPAddress, &log.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		if detailsBytes != nil {
			_ = json.Unmarshal(detailsBytes, &log.Details)
		}
		logs = append(logs, log)
	}
	return logs, nil
}
