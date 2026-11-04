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

func (r *EscalationPolicyRepo) Create(p *models.EscalationPolicy) error {
	query := `
		INSERT INTO escalation_policies (organization_id, name, wait_minutes, notification_channel_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at`
	
	err := r.DB.QueryRow(query, p.OrganizationID, p.Name, p.WaitMinutes, p.NotificationChannelID).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
	return err
}

func (r *EscalationPolicyRepo) Update(p *models.EscalationPolicy) error {
	query := `
		UPDATE escalation_policies 
		SET name = $1, wait_minutes = $2, notification_channel_id = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4 AND organization_id = $5
		RETURNING updated_at`
	
	err := r.DB.QueryRow(query, p.Name, p.WaitMinutes, p.NotificationChannelID, p.ID, p.OrganizationID).Scan(&p.UpdatedAt)
	return err
}

func (r *EscalationPolicyRepo) Delete(id int, orgID int) error {
	query := `DELETE FROM escalation_policies WHERE id = $1 AND organization_id = $2`
	_, err := r.DB.Exec(query, id, orgID)
	return err
}
