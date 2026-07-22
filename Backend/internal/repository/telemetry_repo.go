package repository

import (
	"database/sql"
	"encoding/json"
	"log"
	"strconv"

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

func (r *TelemetryRepository) GetHistoricalEvents(limit, offset int, filters map[string]interface{}) ([]models.Telemetry, int, error) {
	var total int
	
	// A simpler robust dynamic query builder
	whereClauses := []string{}
	args := []interface{}{}
	argCount := 1

	needsDeviceJoin := false
	if bid, ok := filters["building_id"].(string); ok && bid != "" {
		needsDeviceJoin = true
		whereClauses = append(whereClauses, `d.building_id = $`+strconv.Itoa(argCount))
		args = append(args, bid)
		argCount++
	}
	if did, ok := filters["device_id"].(string); ok && did != "" {
		whereClauses = append(whereClauses, `t.device_id = $`+strconv.Itoa(argCount))
		args = append(args, did)
		argCount++
	}
	if sDate, ok := filters["start_date"].(string); ok && sDate != "" {
		whereClauses = append(whereClauses, `t.timestamp >= $`+strconv.Itoa(argCount))
		args = append(args, sDate)
		argCount++
	}
	if eDate, ok := filters["end_date"].(string); ok && eDate != "" {
		whereClauses = append(whereClauses, `t.timestamp <= $`+strconv.Itoa(argCount))
		args = append(args, eDate)
		argCount++
	}
	if eType, ok := filters["event_type"].(string); ok && eType != "" {
		needsDeviceJoin = true
		whereClauses = append(whereClauses, `d.type = $`+strconv.Itoa(argCount))
		args = append(args, eType)
		argCount++
	}

	fromClause := ` FROM telemetry t `
	if needsDeviceJoin {
		fromClause += ` JOIN devices d ON t.device_id = d.id `
	}

	whereString := ""
	if len(whereClauses) > 0 {
		whereString = " WHERE "
		for i, wc := range whereClauses {
			if i > 0 {
				whereString += " AND "
			}
			whereString += wc
		}
	}

	finalCountQuery := `SELECT COUNT(*) ` + fromClause + whereString
	err := r.db.QueryRow(finalCountQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Add limit and offset
	finalQuery := `SELECT t.id, t.device_id, t.temperature, t.humidity, t.status, t.payload, t.timestamp ` + fromClause + whereString + ` ORDER BY t.timestamp DESC LIMIT $` + strconv.Itoa(argCount) + ` OFFSET $` + strconv.Itoa(argCount+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(finalQuery, args...)
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
