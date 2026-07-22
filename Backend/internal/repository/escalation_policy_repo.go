package repository

import (
	"database/sql"
	"eventstream/internal/models"
)

type EscalationPolicyRepo struct {
	DB *sql.DB
}

func NewEscalationPolicyRepo(db *sql.DB) *EscalationPolicyRepo {
	return &EscalationPolicyRepo{DB: db}
}

func (r *EscalationPolicyRepo) ListByOrg(orgID int) ([]models.EscalationPolicy, error) {
	query := `SELECT id, organization_id, name, wait_minutes, notification_channel_id, created_at, updated_at FROM escalation_policies WHERE organization_id = $1`
	rows, err := r.DB.Query(query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var policies []models.EscalationPolicy
	for rows.Next() {
		var p models.EscalationPolicy
		if err := rows.Scan(&p.ID, &p.OrganizationID, &p.Name, &p.WaitMinutes, &p.NotificationChannelID, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		policies = append(policies, p)
	}
	return policies, nil
}
