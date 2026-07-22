package repository

import (
	"database/sql"
	"eventstream/internal/models"
)

type AIConfigRepo struct {
	DB *sql.DB
}

func NewAIConfigRepo(db *sql.DB) *AIConfigRepo {
	return &AIConfigRepo{DB: db}
}

func (r *AIConfigRepo) GetActiveConfig(organizationID int) (*models.AIConfiguration, error) {
	query := `SELECT id, organization_id, provider_type, api_key, model_name, is_active, created_at, updated_at
	          FROM ai_configurations
			  WHERE organization_id = $1 AND is_active = true
			  ORDER BY updated_at DESC LIMIT 1`
	var cfg models.AIConfiguration
	err := r.DB.QueryRow(query, organizationID).Scan(
		&cfg.ID, &cfg.OrganizationID, &cfg.ProviderType, &cfg.APIKey,
		&cfg.ModelName, &cfg.IsActive, &cfg.CreatedAt, &cfg.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &cfg, nil
}

func (r *AIConfigRepo) SetConfig(cfg *models.AIConfiguration) error {
	// Deactivate others
	_, err := r.DB.Exec(`UPDATE ai_configurations SET is_active = false WHERE organization_id = $1`, cfg.OrganizationID)
	if err != nil {
		return err
	}

	query := `INSERT INTO ai_configurations (organization_id, provider_type, api_key, model_name, is_active)
	          VALUES ($1, $2, $3, $4, true) RETURNING id, created_at, updated_at`
	return r.DB.QueryRow(query, cfg.OrganizationID, cfg.ProviderType, cfg.APIKey, cfg.ModelName).Scan(&cfg.ID, &cfg.CreatedAt, &cfg.UpdatedAt)
}
