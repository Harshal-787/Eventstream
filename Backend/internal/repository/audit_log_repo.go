package repository

import (
	"database/sql"
	"encoding/json"
	"log"

	"eventstream/internal/models"
)

type AuditLogRepository struct {
	db *sql.DB
}

func NewAuditLogRepository(db *sql.DB) *AuditLogRepository {
	return &AuditLogRepository{db: db}
}

func (r *AuditLogRepository) Create(logEntry *models.AuditLog) error {
	detailsJSON, err := json.Marshal(logEntry.Details)
	if err != nil {
		detailsJSON = []byte("{}")
	}

	query := `
		INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING id, created_at
	`
	err = r.db.QueryRow(
		query,
		logEntry.UserID,
		logEntry.Action,
		logEntry.EntityType,
		logEntry.EntityID,
		detailsJSON,
		logEntry.IPAddress,
	).Scan(&logEntry.ID, &logEntry.CreatedAt)

	if err != nil {
		log.Printf("Error creating audit log: %v\n", err)
		return err
	}
	return nil
}

func (r *AuditLogRepository) GetLogs(limit, offset int) ([]models.AuditLog, int, error) {
	// Get total count
	var total int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM audit_logs`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := `
		SELECT 
			a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.details, a.ip_address, a.created_at,
			u.name, u.role
		FROM audit_logs a
		LEFT JOIN users u ON a.user_id = u.id
		ORDER BY a.created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var l models.AuditLog
		var detailsBytes []byte
		var uName, uRole sql.NullString

		err := rows.Scan(
			&l.ID, &l.UserID, &l.Action, &l.EntityType, &l.EntityID, &detailsBytes, &l.IPAddress, &l.CreatedAt,
			&uName, &uRole,
		)
		if err != nil {
			return nil, 0, err
		}

		if uName.Valid {
			name := uName.String
			l.UserName = &name
		}
		if uRole.Valid {
			role := uRole.String
			l.UserRole = &role
		}

		l.SetDetailsFromJSONB(detailsBytes)
		logs = append(logs, l)
	}

	return logs, total, nil
}
