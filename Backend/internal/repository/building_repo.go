package repository

import (
	"database/sql"
	"eventstream/internal/models"
)

type BuildingRepository struct {
	db *sql.DB
}

func NewBuildingRepository(db *sql.DB) *BuildingRepository {
	return &BuildingRepository{db: db}
}

func (r *BuildingRepository) CreateBuilding(name, address, city, state, zipCode string, ownerID int, status string) (*models.Building, error) {
	b := &models.Building{}
	query := `INSERT INTO buildings (name, address, city, state, zip_code, owner_id, status) 
              VALUES ($1, $2, $3, $4, $5, $6, $7) 
              RETURNING id, name, address, city, state, zip_code, owner_id, status, created_at`
	err := r.db.QueryRow(query, name, address, city, state, zipCode, ownerID, status).Scan(
		&b.ID, &b.Name, &b.Address, &b.City, &b.State, &b.ZipCode, &b.OwnerID, &b.Status, &b.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *BuildingRepository) GetByID(id int) (*models.Building, error) {
	b := &models.Building{}
	query := `SELECT id, name, address, city, state, zip_code, owner_id, status, created_at FROM buildings WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(
		&b.ID, &b.Name, &b.Address, &b.City, &b.State, &b.ZipCode, &b.OwnerID, &b.Status, &b.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *BuildingRepository) List(ownerID *int) ([]*models.Building, error) {
	var rows *sql.Rows
	var err error

	if ownerID != nil {
		query := `SELECT id, name, address, city, state, zip_code, owner_id, status, created_at FROM buildings WHERE owner_id = $1`
		rows, err = r.db.Query(query, *ownerID)
	} else {
		query := `SELECT id, name, address, city, state, zip_code, owner_id, status, created_at FROM buildings`
		rows, err = r.db.Query(query)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var buildings []*models.Building
	for rows.Next() {
		b := &models.Building{}
		err := rows.Scan(&b.ID, &b.Name, &b.Address, &b.City, &b.State, &b.ZipCode, &b.OwnerID, &b.Status, &b.CreatedAt)
		if err != nil {
			return nil, err
		}
		buildings = append(buildings, b)
	}
	return buildings, nil
}

func (r *BuildingRepository) UpdateStatus(id int, status string) error {
	query := `UPDATE buildings SET status = $1 WHERE id = $2`
	_, err := r.db.Exec(query, status, id)
	return err
}

func (r *BuildingRepository) UpdateBuilding(id int, name, address, city, state, zipCode string) error {
	query := `UPDATE buildings SET name = $1, address = $2, city = $3, state = $4, zip_code = $5 WHERE id = $6`
	_, err := r.db.Exec(query, name, address, city, state, zipCode, id)
	return err
}

func (r *BuildingRepository) DeleteBuilding(id int) error {
	query := `DELETE FROM buildings WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *BuildingRepository) DeleteByOwnerID(ownerID int) error {
	query := `DELETE FROM buildings WHERE owner_id = $1`
	_, err := r.db.Exec(query, ownerID)
	return err
}
