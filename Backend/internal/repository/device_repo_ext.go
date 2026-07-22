package repository

import (
	"database/sql"
	"eventstream/internal/models"
)

func (r *DeviceRepo) GetDeviceByID(id int) (*models.Device, error) {
	var d models.Device
	err := r.DB.QueryRow(`
		SELECT id, organization_id, hardware_id, name, type, model_id, building_id, floor_id, room_id, status, metadata, battery_pct, signal_strength, firmware_version, last_communication_at, activation_status, provisioning_token, map_x, map_y, created_at
		FROM devices
		WHERE id = $1
	`, id).Scan(
		&d.ID, &d.OrganizationID, &d.HardwareID, &d.Name, &d.Type, &d.ModelID, &d.BuildingID, &d.FloorID, &d.RoomID, &d.Status, &d.Metadata, &d.BatteryPct, &d.SignalStrength, &d.FirmwareVersion, &d.LastCommunicationAt, &d.ActivationStatus, &d.ProvisioningToken, &d.MapX, &d.MapY, &d.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &d, nil
}

func (r *DeviceRepo) GetDeviceByHardwareID(hardwareID string) (*models.Device, error) {
	var d models.Device
	err := r.DB.QueryRow(`
		SELECT id, organization_id, hardware_id, name, type, model_id, building_id, floor_id, room_id, status, metadata, battery_pct, signal_strength, firmware_version, last_communication_at, activation_status, provisioning_token, map_x, map_y, created_at
		FROM devices
		WHERE hardware_id = $1
	`, hardwareID).Scan(
		&d.ID, &d.OrganizationID, &d.HardwareID, &d.Name, &d.Type, &d.ModelID, &d.BuildingID, &d.FloorID, &d.RoomID, &d.Status, &d.Metadata, &d.BatteryPct, &d.SignalStrength, &d.FirmwareVersion, &d.LastCommunicationAt, &d.ActivationStatus, &d.ProvisioningToken, &d.MapX, &d.MapY, &d.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &d, nil
}


func (r *DeviceRepo) GetFloorByID(id int) (*models.Floor, error) {
	var f models.Floor
	err := r.DB.QueryRow(`
		SELECT id, building_id, name, level, floor_plan_url, created_at
		FROM floors
		WHERE id = $1
	`, id).Scan(
		&f.ID, &f.BuildingID, &f.Name, &f.Level, &f.FloorPlanURL, &f.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &f, nil
}
