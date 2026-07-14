package repository

import (
	"database/sql"
	"encoding/json"
	"log"

	"eventstream/internal/models"
)

type TelemetryRepository struct {
	db *sql.DB
}

func NewTelemetryRepository(db *sql.DB) *TelemetryRepository {
	return &TelemetryRepository{db: db}
}

func (r *TelemetryRepository) Insert(t *models.Telemetry) error {
	var payloadBytes []byte
	if t.Payload != nil {
		var err error
		payloadBytes, err = json.Marshal(t.Payload)
		if err != nil {
			return err
		}
	}

	query := `
		INSERT INTO telemetry (device_id, temperature, humidity, status, payload, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := r.db.Exec(query, t.DeviceID, t.Temperature, t.Humidity, t.Status, payloadBytes, t.Timestamp)
	if err != nil {
		log.Printf("Error inserting telemetry: %v", err)
	}
	return err
}

func (r *TelemetryRepository) GetHistoricalEvents(limit, offset int) ([]models.Telemetry, int, error) {
	var total int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM telemetry`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, device_id, temperature, humidity, status, payload, timestamp
		FROM telemetry
		ORDER BY timestamp DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var events []models.Telemetry
	for rows.Next() {
		var t models.Telemetry
		var pBytes []byte
		err := rows.Scan(&t.ID, &t.DeviceID, &t.Temperature, &t.Humidity, &t.Status, &pBytes, &t.Timestamp)
		if err != nil {
			return nil, 0, err
		}
		if pBytes != nil {
			_ = json.Unmarshal(pBytes, &t.Payload)
		}
		events = append(events, t)
	}
	return events, total, nil
}
