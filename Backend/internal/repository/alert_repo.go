package repository

import (
	"database/sql"
	"errors"
	"time"

	"eventstream/internal/models"
)

type AlertRepository struct {
	db *sql.DB
}

func NewAlertRepository(db *sql.DB) *AlertRepository {
	return &AlertRepository{db: db}
}

func (r *AlertRepository) List(status string) ([]*models.Alert, error) {
	query := `
		SELECT a.id, a.device_id, a.alert_rule_id, a.type, a.severity, a.status,
		       a.message, a.triggered_at, a.acknowledged_at, a.resolved_at,
		       COALESCE(d.name, ''), COALESCE(b.name, '')
		FROM alerts a
		LEFT JOIN devices d ON a.device_id = d.id
		LEFT JOIN buildings b ON d.building_id = b.id`

	args := []interface{}{}
	if status != "" {
		query += ` WHERE a.status = $1`
		args = append(args, status)
	}
	query += ` ORDER BY a.triggered_at DESC`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []*models.Alert
	for rows.Next() {
		a := &models.Alert{}
		if err := rows.Scan(
			&a.ID, &a.DeviceID, &a.AlertRuleID, &a.Type, &a.Severity, &a.Status,
			&a.Message, &a.TriggeredAt, &a.AcknowledgedAt, &a.ResolvedAt,
			&a.DeviceName, &a.BuildingName,
		); err != nil {
			return nil, err
		}
		alerts = append(alerts, a)
	}
	return alerts, nil
}

func (r *AlertRepository) FindByID(id int) (*models.Alert, error) {
	query := `
		SELECT a.id, a.device_id, a.alert_rule_id, a.type, a.severity, a.status,
		       a.message, a.triggered_at, a.acknowledged_at, a.resolved_at,
		       COALESCE(d.name, ''), COALESCE(b.name, '')
		FROM alerts a
		LEFT JOIN devices d ON a.device_id = d.id
		LEFT JOIN buildings b ON d.building_id = b.id
		WHERE a.id = $1`

	a := &models.Alert{}
	err := r.db.QueryRow(query, id).Scan(
		&a.ID, &a.DeviceID, &a.AlertRuleID, &a.Type, &a.Severity, &a.Status,
		&a.Message, &a.TriggeredAt, &a.AcknowledgedAt, &a.ResolvedAt,
		&a.DeviceName, &a.BuildingName,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return a, nil
}

func (r *AlertRepository) UpdateStatus(id int, status string, ts time.Time) error {
	var query string
	if status == "acknowledged" {
		query = `UPDATE alerts SET status = $1, acknowledged_at = $2 WHERE id = $3`
	} else {
		query = `UPDATE alerts SET status = $1, resolved_at = $2 WHERE id = $3`
	}
	_, err := r.db.Exec(query, status, ts, id)
	return err
}

func (r *AlertRepository) CreateActivityLog(alertID, userID int, action, note string) error {
	query := `INSERT INTO alert_activity_logs (alert_id, user_id, action, note) VALUES ($1, $2, $3, $4)`
	_, err := r.db.Exec(query, alertID, userID, action, note)
	return err
}

func (r *AlertRepository) GetActivityLogs(alertID int) ([]*models.AlertActivityLog, error) {
	query := `
		SELECT l.id, l.alert_id, l.user_id, l.action, COALESCE(l.note, ''),
		       l.created_at, COALESCE(u.name, '')
		FROM alert_activity_logs l
		LEFT JOIN users u ON l.user_id = u.id
		WHERE l.alert_id = $1
		ORDER BY l.created_at ASC`

	rows, err := r.db.Query(query, alertID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*models.AlertActivityLog
	for rows.Next() {
		l := &models.AlertActivityLog{}
		if err := rows.Scan(&l.ID, &l.AlertID, &l.UserID, &l.Action, &l.Note, &l.CreatedAt, &l.UserName); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}
