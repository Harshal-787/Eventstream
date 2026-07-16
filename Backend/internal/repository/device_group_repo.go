package repository

import (
	"database/sql"
	"eventstream/internal/models"
)

type DeviceGroupRepository struct {
	db *sql.DB
}

func NewDeviceGroupRepository(db *sql.DB) *DeviceGroupRepository {
	return &DeviceGroupRepository{db: db}
}

func (r *DeviceGroupRepository) Create(group *models.DeviceGroup) error {
	return r.db.QueryRow(
		`INSERT INTO device_groups (organization_id, name, description)
		 VALUES ($1, $2, $3) RETURNING id, created_at, updated_at`,
		group.OrganizationID, group.Name, group.Description,
	).Scan(&group.ID, &group.CreatedAt, &group.UpdatedAt)
}

func (r *DeviceGroupRepository) ListByOrg(orgID int) ([]models.DeviceGroup, error) {
	rows, err := r.db.Query(`SELECT id, organization_id, name, description, created_at, updated_at FROM device_groups WHERE organization_id = $1`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []models.DeviceGroup
	for rows.Next() {
		var g models.DeviceGroup
		if err := rows.Scan(&g.ID, &g.OrganizationID, &g.Name, &g.Description, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, nil
}

func (r *DeviceGroupRepository) Delete(id, orgID int) error {
	_, err := r.db.Exec(`DELETE FROM device_groups WHERE id = $1 AND organization_id = $2`, id, orgID)
	return err
}

func (r *DeviceGroupRepository) AddDeviceToGroup(groupID, deviceID int) error {
	_, err := r.db.Exec(`INSERT INTO device_group_members (group_id, device_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, groupID, deviceID)
	return err
}

func (r *DeviceGroupRepository) RemoveDeviceFromGroup(groupID, deviceID int) error {
	_, err := r.db.Exec(`DELETE FROM device_group_members WHERE group_id = $1 AND device_id = $2`, groupID, deviceID)
	return err
}
