package repository

import (
	"database/sql"
	"encoding/json"
	"eventstream/internal/models"
)

type DeviceTwinRepository struct {
	db *sql.DB
}

func NewDeviceTwinRepository(db *sql.DB) *DeviceTwinRepository {
	return &DeviceTwinRepository{db: db}
}

func (r *DeviceTwinRepository) UpsertTwin(twin *models.DeviceTwin) error {
	desiredBytes, _ := json.Marshal(twin.DesiredState)
	reportedBytes, _ := json.Marshal(twin.ReportedState)
	configBytes, _ := json.Marshal(twin.Configuration)

	query := `
		INSERT INTO device_twins (device_id, desired_state, reported_state, configuration, health_score, updated_at)
		VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
		ON CONFLICT (device_id) DO UPDATE SET
			desired_state = EXCLUDED.desired_state,
			reported_state = EXCLUDED.reported_state,
			configuration = EXCLUDED.configuration,
			health_score = EXCLUDED.health_score,
			updated_at = CURRENT_TIMESTAMP
	`
	_, err := r.db.Exec(query, twin.DeviceID, desiredBytes, reportedBytes, configBytes, twin.HealthScore)
	return err
}

func (r *DeviceTwinRepository) GetTwin(deviceID int) (*models.DeviceTwin, error) {
	query := `
		SELECT device_id, desired_state, reported_state, configuration, health_score, updated_at
		FROM device_twins
		WHERE device_id = $1
	`
	twin := &models.DeviceTwin{}
	var desiredBytes, reportedBytes, configBytes []byte

	err := r.db.QueryRow(query, deviceID).Scan(
		&twin.DeviceID, &desiredBytes, &reportedBytes, &configBytes, &twin.HealthScore, &twin.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			// Return a default twin if none exists
			return &models.DeviceTwin{
				DeviceID:      deviceID,
				DesiredState:  make(map[string]interface{}),
				ReportedState: make(map[string]interface{}),
				Configuration: make(map[string]interface{}),
				HealthScore:   100,
			}, nil
		}
		return nil, err
	}

	_ = json.Unmarshal(desiredBytes, &twin.DesiredState)
	_ = json.Unmarshal(reportedBytes, &twin.ReportedState)
	_ = json.Unmarshal(configBytes, &twin.Configuration)

	return twin, nil
}
