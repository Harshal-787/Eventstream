package repository

import (
	"database/sql"
	"eventstream/internal/models"
	"time"

	"github.com/lib/pq"
)

type APIKeyRepository struct {
	db *sql.DB
}

func NewAPIKeyRepository(db *sql.DB) *APIKeyRepository {
	return &APIKeyRepository{db: db}
}

func (r *APIKeyRepository) CreateAPIKey(orgID int, name, keyHash, preview string, scopes []string, expiresAt *time.Time, createdBy int) (*models.APIKey, error) {
	key := &models.APIKey{}
	query := `
		INSERT INTO api_keys (organization_id, name, key_hash, preview, scopes, expires_at, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, organization_id, name, preview, scopes, is_active, expires_at, created_at, created_by
	`
	err := r.db.QueryRow(query, orgID, name, keyHash, preview, pq.Array(scopes), expiresAt, createdBy).Scan(
		&key.ID, &key.OrganizationID, &key.Name, &key.Preview, pq.Array(&key.Scopes), &key.IsActive, &key.ExpiresAt, &key.CreatedAt, &key.CreatedBy,
	)
	if err != nil {
		return nil, err
	}
	return key, nil
}

func (r *APIKeyRepository) GetAPIKeyByHash(keyHash string) (*models.APIKey, error) {
	key := &models.APIKey{}
	query := `
		SELECT id, organization_id, name, preview, scopes, is_active, expires_at, last_used_at, created_at, created_by
		FROM api_keys
		WHERE key_hash = $1 AND is_active = true
	`
	err := r.db.QueryRow(query, keyHash).Scan(
		&key.ID, &key.OrganizationID, &key.Name, &key.Preview, pq.Array(&key.Scopes), &key.IsActive, &key.ExpiresAt, &key.LastUsedAt, &key.CreatedAt, &key.CreatedBy,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return key, nil
}

func (r *APIKeyRepository) UpdateLastUsed(id int) error {
	query := `UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *APIKeyRepository) ListAPIKeys(orgID int) ([]*models.APIKey, error) {
	query := `
		SELECT id, organization_id, name, preview, scopes, is_active, expires_at, last_used_at, created_at, created_by
		FROM api_keys
		WHERE organization_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []*models.APIKey
	for rows.Next() {
		key := &models.APIKey{}
		err := rows.Scan(
			&key.ID, &key.OrganizationID, &key.Name, &key.Preview, pq.Array(&key.Scopes), &key.IsActive, &key.ExpiresAt, &key.LastUsedAt, &key.CreatedAt, &key.CreatedBy,
		)
		if err != nil {
			return nil, err
		}
		keys = append(keys, key)
	}
	return keys, nil
}

func (r *APIKeyRepository) RevokeAPIKey(id int, orgID int) error {
	query := `UPDATE api_keys SET is_active = false WHERE id = $1 AND organization_id = $2`
	_, err := r.db.Exec(query, id, orgID)
	return err
}
