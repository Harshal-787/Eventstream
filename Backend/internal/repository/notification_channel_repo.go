package repository

import (
	"database/sql"
	"eventstream/internal/models"
)

type NotificationChannelRepo struct {
	DB *sql.DB
}

func NewNotificationChannelRepo(db *sql.DB) *NotificationChannelRepo {
	return &NotificationChannelRepo{DB: db}
}

func (r *NotificationChannelRepo) Create(nc *models.NotificationChannel) error {
	query := `
		INSERT INTO notification_channels (organization_id, name, type, webhook_url, config, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`
	return r.DB.QueryRow(query, nc.OrganizationID, nc.Name, nc.Type, nc.WebhookURL, nc.Config, nc.IsActive).Scan(&nc.ID, &nc.CreatedAt, &nc.UpdatedAt)
}

func (r *NotificationChannelRepo) ListByOrg(orgID int) ([]models.NotificationChannel, error) {
	query := `
		SELECT id, organization_id, name, type, webhook_url, config, is_active, created_at, updated_at
		FROM notification_channels
		WHERE organization_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.DB.Query(query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var channels []models.NotificationChannel
	for rows.Next() {
		var nc models.NotificationChannel
		if err := rows.Scan(&nc.ID, &nc.OrganizationID, &nc.Name, &nc.Type, &nc.WebhookURL, &nc.Config, &nc.IsActive, &nc.CreatedAt, &nc.UpdatedAt); err != nil {
			return nil, err
		}
		channels = append(channels, nc)
	}
	return channels, nil
}

func (r *NotificationChannelRepo) Update(nc *models.NotificationChannel) error {
	query := `
		UPDATE notification_channels
		SET name = $1, type = $2, webhook_url = $3, config = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $6 AND organization_id = $7
	`
	_, err := r.DB.Exec(query, nc.Name, nc.Type, nc.WebhookURL, nc.Config, nc.IsActive, nc.ID, nc.OrganizationID)
	return err
}

func (r *NotificationChannelRepo) Delete(id int, orgID int) error {
	query := `DELETE FROM notification_channels WHERE id = $1 AND organization_id = $2`
	_, err := r.DB.Exec(query, id, orgID)
	return err
}

func (r *NotificationChannelRepo) GetActiveByOrg(orgID int) ([]models.NotificationChannel, error) {
	query := `
		SELECT id, organization_id, name, type, webhook_url, config, is_active, created_at, updated_at
		FROM notification_channels
		WHERE organization_id = $1 AND is_active = true
	`
	rows, err := r.DB.Query(query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var channels []models.NotificationChannel
	for rows.Next() {
		var nc models.NotificationChannel
		if err := rows.Scan(&nc.ID, &nc.OrganizationID, &nc.Name, &nc.Type, &nc.WebhookURL, &nc.Config, &nc.IsActive, &nc.CreatedAt, &nc.UpdatedAt); err != nil {
			return nil, err
		}
		channels = append(channels, nc)
	}
	return channels, nil
}
