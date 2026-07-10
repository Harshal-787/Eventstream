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

func (r *BuildingRepository) CreateBuilding(name, address, city, state, zipCode string, ownerID int, status string, latitude, longitude *float64, ubid, parcelNumber, bin *string) (*models.Building, error) {
	b := &models.Building{}
	query := `INSERT INTO buildings (name, address, city, state, zip_code, owner_id, status, latitude, longitude, ubid, parcel_number, bin) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
              RETURNING id, name, address, city, state, zip_code, latitude, longitude, ubid, parcel_number, bin, owner_id, status, created_at`
	err := r.db.QueryRow(query, name, address, city, state, zipCode, ownerID, status, latitude, longitude, ubid, parcelNumber, bin).Scan(
		&b.ID, &b.Name, &b.Address, &b.City, &b.State, &b.ZipCode, &b.Latitude, &b.Longitude, &b.UBID, &b.ParcelNumber, &b.BIN, &b.OwnerID, &b.Status, &b.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *BuildingRepository) GetByID(id int) (*models.Building, error) {
	b := &models.Building{}
	query := `
		SELECT b.id, b.name, b.address, b.city, b.state, b.zip_code, b.latitude, b.longitude, b.ubid, b.parcel_number, b.bin, b.owner_id, b.status, b.created_at, COALESCE(u.name, '') as owner_name 
		FROM buildings b
		LEFT JOIN users u ON b.owner_id = u.id
		WHERE b.id = $1`
	err := r.db.QueryRow(query, id).Scan(
		&b.ID, &b.Name, &b.Address, &b.City, &b.State, &b.ZipCode, &b.Latitude, &b.Longitude, &b.UBID, &b.ParcelNumber, &b.BIN, &b.OwnerID, &b.Status, &b.CreatedAt, &b.OwnerName,
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
		query := `
			SELECT b.id, b.name, b.address, b.city, b.state, b.zip_code, b.latitude, b.longitude, b.ubid, b.parcel_number, b.bin, b.owner_id, b.status, b.created_at, COALESCE(u.name, '') as owner_name 
			FROM buildings b
			LEFT JOIN users u ON b.owner_id = u.id
			WHERE b.owner_id = $1`
		rows, err = r.db.Query(query, *ownerID)
	} else {
		query := `
			SELECT b.id, b.name, b.address, b.city, b.state, b.zip_code, b.latitude, b.longitude, b.ubid, b.parcel_number, b.bin, b.owner_id, b.status, b.created_at, COALESCE(u.name, '') as owner_name 
			FROM buildings b
			LEFT JOIN users u ON b.owner_id = u.id`
		rows, err = r.db.Query(query)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var buildings []*models.Building
	for rows.Next() {
		b := &models.Building{}
		err := rows.Scan(&b.ID, &b.Name, &b.Address, &b.City, &b.State, &b.ZipCode, &b.Latitude, &b.Longitude, &b.UBID, &b.ParcelNumber, &b.BIN, &b.OwnerID, &b.Status, &b.CreatedAt, &b.OwnerName)
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

func (r *BuildingRepository) UpdateBuilding(id int, name, address, city, state, zipCode string, latitude, longitude *float64, ubid, parcelNumber, bin *string) error {
	query := `UPDATE buildings SET name = $1, address = $2, city = $3, state = $4, zip_code = $5, latitude = $6, longitude = $7, ubid = $8, parcel_number = $9, bin = $10 WHERE id = $11`
	_, err := r.db.Exec(query, name, address, city, state, zipCode, latitude, longitude, ubid, parcelNumber, bin, id)
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
