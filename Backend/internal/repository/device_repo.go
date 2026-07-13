package repository

import (
	"database/sql"
	"eventstream/internal/models"
)

type DeviceRepo struct {
	DB *sql.DB
}

func NewDeviceRepo(db *sql.DB) *DeviceRepo {
	return &DeviceRepo{DB: db}
}

// --- Device Models ---
func (r *DeviceRepo) GetModels() ([]models.DeviceModel, error) {
	query := `
		SELECT 
			id, brand, model_name, sensor_type, heartbeat_interval, created_at,
			connectivity_protocol, power_source, expected_battery_life_months,
			payload_decoder, ip_rating, min_operating_temp, max_operating_temp,
			documentation_url, image_url
		FROM device_models
		ORDER BY brand, model_name
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var modelsList []models.DeviceModel
	for rows.Next() {
		var m models.DeviceModel
		if err := rows.Scan(
			&m.ID, &m.Brand, &m.ModelName, &m.SensorType, &m.HeartbeatInterval, &m.CreatedAt,
			&m.ConnectivityProtocol, &m.PowerSource, &m.ExpectedBatteryLifeMonths,
			&m.PayloadDecoder, &m.IPRating, &m.MinOperatingTemp, &m.MaxOperatingTemp,
			&m.DocumentationURL, &m.ImageURL,
		); err != nil {
			return nil, err
		}
		modelsList = append(modelsList, m)
	}
	return modelsList, nil
}

// --- Floors and Rooms ---
func (r *DeviceRepo) GetFloorsByBuilding(buildingID int) ([]models.Floor, error) {
	query := `SELECT id, building_id, level, name, created_at FROM floors WHERE building_id = $1 ORDER BY level`
	rows, err := r.DB.Query(query, buildingID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var floors []models.Floor
	for rows.Next() {
		var f models.Floor
		err := rows.Scan(&f.ID, &f.BuildingID, &f.Level, &f.Name, &f.CreatedAt)
		if err != nil {
			return nil, err
		}
		floors = append(floors, f)
	}
	return floors, nil
}

func (r *DeviceRepo) CreateFloor(f *models.Floor) error {
	query := `INSERT INTO floors (building_id, level, name) VALUES ($1, $2, $3) RETURNING id, created_at`
	return r.DB.QueryRow(query, f.BuildingID, f.Level, f.Name).Scan(&f.ID, &f.CreatedAt)
}

func (r *DeviceRepo) UpdateFloor(id int, name string, level int) error {
	query := `UPDATE floors SET name = $1, level = $2 WHERE id = $3`
	_, err := r.DB.Exec(query, name, level, id)
	return err
}

func (r *DeviceRepo) DeleteFloor(id int) error {
	query := `DELETE FROM floors WHERE id = $1`
	_, err := r.DB.Exec(query, id)
	return err
}

func (r *DeviceRepo) GetRoomsByFloor(floorID int) ([]models.Room, error) {
	query := `SELECT id, floor_id, name, type, created_at FROM rooms WHERE floor_id = $1 ORDER BY name`
	rows, err := r.DB.Query(query, floorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rooms []models.Room
	for rows.Next() {
		var rm models.Room
		err := rows.Scan(&rm.ID, &rm.FloorID, &rm.Name, &rm.Type, &rm.CreatedAt)
		if err != nil {
			return nil, err
		}
		rooms = append(rooms, rm)
	}
	return rooms, nil
}

func (r *DeviceRepo) CreateRoom(rm *models.Room) error {
	query := `INSERT INTO rooms (floor_id, name, type) VALUES ($1, $2, $3) RETURNING id, created_at`
	return r.DB.QueryRow(query, rm.FloorID, rm.Name, rm.Type).Scan(&rm.ID, &rm.CreatedAt)
}

func (r *DeviceRepo) UpdateRoom(id int, name string, roomType string) error {
	query := `UPDATE rooms SET name = $1, type = $2 WHERE id = $3`
	_, err := r.DB.Exec(query, name, roomType, id)
	return err
}

func (r *DeviceRepo) DeleteRoom(id int) error {
	query := `DELETE FROM rooms WHERE id = $1`
	_, err := r.DB.Exec(query, id)
	return err
}

// --- Devices ---
func (r *DeviceRepo) CreateDevice(d *models.Device) error {
	query := `INSERT INTO devices (hardware_id, name, type, model_id, building_id, floor_id, room_id, status, metadata, battery_pct, signal_strength) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, created_at`
	return r.DB.QueryRow(query, d.HardwareID, d.Name, d.Type, d.ModelID, d.BuildingID, d.FloorID, d.RoomID, d.Status, d.Metadata, d.BatteryPct, d.SignalStrength).Scan(&d.ID, &d.CreatedAt)
}

func (r *DeviceRepo) UpdateDevice(d *models.Device) error {
	query := `UPDATE devices SET hardware_id=$1, name=$2, type=$3, model_id=$4, building_id=$5, floor_id=$6, room_id=$7, status=$8, metadata=$9, battery_pct=$10, signal_strength=$11 WHERE id=$12`
	_, err := r.DB.Exec(query, d.HardwareID, d.Name, d.Type, d.ModelID, d.BuildingID, d.FloorID, d.RoomID, d.Status, d.Metadata, d.BatteryPct, d.SignalStrength, d.ID)
	return err
}

func (r *DeviceRepo) DeleteDevice(id int) error {
	query := `DELETE FROM devices WHERE id=$1`
	_, err := r.DB.Exec(query, id)
	return err
}

func (r *DeviceRepo) UpdateDeviceStatus(id int, status string) error {
	query := `UPDATE devices SET status=$1 WHERE id=$2`
	_, err := r.DB.Exec(query, status, id)
	return err
}

func (r *DeviceRepo) CreateModel(model *models.DeviceModel) error {
	query := `
		INSERT INTO device_models (
			brand, model_name, sensor_type,
			connectivity_protocol, power_source, expected_battery_life_months,
			payload_decoder, ip_rating, min_operating_temp, max_operating_temp,
			documentation_url, image_url
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`
	return r.DB.QueryRow(
		query, 
		model.Brand, model.ModelName, model.SensorType,
		model.ConnectivityProtocol, model.PowerSource, model.ExpectedBatteryLifeMonths,
		model.PayloadDecoder, model.IPRating, model.MinOperatingTemp, model.MaxOperatingTemp,
		model.DocumentationURL, model.ImageURL,
	).Scan(&model.ID)
}

func (r *DeviceRepo) GetDevices(buildingID *int, status string, ownerID *int) ([]models.Device, error) {
	query := `
		SELECT d.id, d.hardware_id, d.name, d.type, d.model_id, d.building_id, d.floor_id, d.room_id, d.status, d.metadata, d.battery_pct, d.signal_strength, d.created_at,
		       COALESCE(dm.model_name, ''), COALESCE(dm.brand, ''), COALESCE(b.name, ''), COALESCE(f.name, ''), COALESCE(r.name, '')
		FROM devices d
		LEFT JOIN device_models dm ON d.model_id = dm.id
		LEFT JOIN buildings b ON d.building_id = b.id
		LEFT JOIN floors f ON d.floor_id = f.id
		LEFT JOIN rooms r ON d.room_id = r.id
		WHERE ($1::int IS NULL OR d.building_id = $1)
		  AND ($2::text = '' OR d.status = $2)
		  AND ($3::int IS NULL OR b.owner_id = $3)
		ORDER BY d.created_at DESC`
		
	rows, err := r.DB.Query(query, buildingID, status, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var devices []models.Device
	for rows.Next() {
		var d models.Device
		err := rows.Scan(&d.ID, &d.HardwareID, &d.Name, &d.Type, &d.ModelID, &d.BuildingID, &d.FloorID, &d.RoomID, &d.Status, &d.Metadata, &d.BatteryPct, &d.SignalStrength, &d.CreatedAt,
			&d.ModelName, &d.Brand, &d.BuildingName, &d.FloorName, &d.RoomName)
		if err != nil {
			return nil, err
		}
		devices = append(devices, d)
	}
	return devices, nil
}

// --- Sensor Requests ---
func (r *DeviceRepo) CreateSensorRequest(sr *models.SensorRequest) error {
	query := `INSERT INTO sensor_requests (user_id, building_id, floor_id, room_id, sensor_type, reason, brand, model_name, hardware_id, status) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, created_at`
	return r.DB.QueryRow(query, sr.UserID, sr.BuildingID, sr.FloorID, sr.RoomID, sr.SensorType, sr.Reason, sr.Brand, sr.ModelName, sr.HardwareID, sr.Status).Scan(&sr.ID, &sr.CreatedAt)
}

func (r *DeviceRepo) GetSensorRequests(buildingID *int) ([]models.SensorRequest, error) {
	query := `
		SELECT sr.id, sr.user_id, sr.building_id, sr.floor_id, sr.room_id, sr.sensor_type, sr.reason, sr.brand, sr.model_name, sr.hardware_id, sr.status, sr.fulfilled_by, sr.fulfilled_at, sr.created_at,
		       COALESCE(u.name, ''), COALESCE(b.name, ''), COALESCE(f.name, ''), COALESCE(rm.name, '')
		FROM sensor_requests sr
		LEFT JOIN users u ON sr.user_id = u.id
		LEFT JOIN buildings b ON sr.building_id = b.id
		LEFT JOIN floors f ON sr.floor_id = f.id
		LEFT JOIN rooms rm ON sr.room_id = rm.id
		WHERE ($1::int IS NULL OR sr.building_id = $1)
		ORDER BY sr.created_at DESC`
	rows, err := r.DB.Query(query, buildingID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reqs []models.SensorRequest
	for rows.Next() {
		var sr models.SensorRequest
		err := rows.Scan(&sr.ID, &sr.UserID, &sr.BuildingID, &sr.FloorID, &sr.RoomID, &sr.SensorType, &sr.Reason, &sr.Brand, &sr.ModelName, &sr.HardwareID, &sr.Status, &sr.FulfilledBy, &sr.FulfilledAt, &sr.CreatedAt,
			&sr.UserName, &sr.BuildingName, &sr.FloorName, &sr.RoomName)
		if err != nil {
			return nil, err
		}
		reqs = append(reqs, sr)
	}
	return reqs, nil
}

func (r *DeviceRepo) UpdateSensorRequestStatus(reqID int, status string, fulfilledBy *int) error {
	query := `UPDATE sensor_requests SET status = $1, fulfilled_by = $2, fulfilled_at = NOW() WHERE id = $3`
	_, err := r.DB.Exec(query, status, fulfilledBy, reqID)
	return err
}

func (r *DeviceRepo) DeleteSensorRequest(reqID int) error {
	query := `DELETE FROM sensor_requests WHERE id = $1`
	_, err := r.DB.Exec(query, reqID)
	return err
}
