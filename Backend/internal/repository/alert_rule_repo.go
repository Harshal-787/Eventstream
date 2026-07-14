package repository

import (
	"database/sql"
	"eventstream/internal/models"
)

type AlertRuleRepository struct {
	db *sql.DB
}

func NewAlertRuleRepository(db *sql.DB) *AlertRuleRepository {
	return &AlertRuleRepository{db: db}
}

func (r *AlertRuleRepository) List() ([]models.AlertRule, error) {
	query := `
		SELECT ar.id, ar.name, ar.device_type, ar.metric, ar.operator, ar.threshold, ar.bool_value, ar.severity, ar.is_active, ar.target_type, ar.target_id, ar.created_by, ar.created_at,
		       CASE 
		           WHEN ar.target_type = 'device' THEN (SELECT name FROM devices WHERE id = ar.target_id)
		           WHEN ar.target_type = 'room' THEN (SELECT name FROM rooms WHERE id = ar.target_id)
		           WHEN ar.target_type = 'building' THEN (SELECT name FROM buildings WHERE id = ar.target_id)
		           ELSE NULL
		       END as target_name,
		       u.name as created_by_name,
		       CASE WHEN ar.target_type = 'device' THEN (SELECT hardware_id FROM devices WHERE id = ar.target_id) ELSE NULL END as hardware_id,
		       CASE 
		           WHEN ar.target_type = 'device' THEN (SELECT b.name FROM devices d JOIN buildings b ON d.building_id = b.id WHERE d.id = ar.target_id)
		           WHEN ar.target_type = 'room' THEN (SELECT b.name FROM rooms r JOIN floors f ON r.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE r.id = ar.target_id)
		           WHEN ar.target_type = 'building' THEN (SELECT name FROM buildings WHERE id = ar.target_id)
		           ELSE NULL
		       END as building_name,
		       CASE 
		           WHEN ar.target_type = 'device' THEN (SELECT f.name FROM devices d JOIN floors f ON d.floor_id = f.id WHERE d.id = ar.target_id)
		           WHEN ar.target_type = 'room' THEN (SELECT f.name FROM rooms r JOIN floors f ON r.floor_id = f.id WHERE r.id = ar.target_id)
		           ELSE NULL
		       END as floor_name,
		       CASE 
		           WHEN ar.target_type = 'device' THEN (SELECT r.name FROM devices d JOIN rooms r ON d.room_id = r.id WHERE d.id = ar.target_id)
		           WHEN ar.target_type = 'room' THEN (SELECT name FROM rooms WHERE id = ar.target_id)
		           ELSE NULL
		       END as room_name
		FROM alert_rules ar
		LEFT JOIN users u ON ar.created_by = u.id
		ORDER BY ar.created_at DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []models.AlertRule
	for rows.Next() {
		var rule models.AlertRule
		err := rows.Scan(
			&rule.ID, &rule.Name, &rule.DeviceType, &rule.Metric, &rule.Operator,
			&rule.Threshold, &rule.BoolValue, &rule.Severity, &rule.IsActive, &rule.TargetType, &rule.TargetID, &rule.CreatedBy, &rule.CreatedAt,
			&rule.TargetName, &rule.CreatedByName, &rule.HardwareID, &rule.BuildingName, &rule.FloorName, &rule.RoomName,
		)
		if err != nil {
			return nil, err
		}
		rules = append(rules, rule)
	}
	return rules, nil
}

func (r *AlertRuleRepository) GetActiveRules() ([]models.AlertRule, error) {
	query := `
		SELECT id, name, device_type, metric, operator, threshold, bool_value, severity, is_active, target_type, target_id
		FROM alert_rules
		WHERE is_active = true
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []models.AlertRule
	for rows.Next() {
		var rule models.AlertRule
		err := rows.Scan(
			&rule.ID, &rule.Name, &rule.DeviceType, &rule.Metric, &rule.Operator,
			&rule.Threshold, &rule.BoolValue, &rule.Severity, &rule.IsActive, &rule.TargetType, &rule.TargetID,
		)
		if err != nil {
			return nil, err
		}
		rules = append(rules, rule)
	}
	return rules, nil
}

func (r *AlertRuleRepository) Create(rule *models.AlertRule) error {
	query := `
		INSERT INTO alert_rules (name, device_type, metric, operator, threshold, bool_value, severity, is_active, target_type, target_id, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at
	`
	return r.db.QueryRow(
		query, rule.Name, rule.DeviceType, rule.Metric, rule.Operator,
		rule.Threshold, rule.BoolValue, rule.Severity, rule.IsActive, rule.TargetType, rule.TargetID, rule.CreatedBy,
	).Scan(&rule.ID, &rule.CreatedAt)
}

func (r *AlertRuleRepository) Update(id int, rule *models.AlertRule) error {
	query := `
		UPDATE alert_rules
		SET name = $1, device_type = $2, metric = $3, operator = $4, threshold = $5, bool_value = $6, severity = $7, is_active = $8, target_type = $9, target_id = $10
		WHERE id = $11
	`
	_, err := r.db.Exec(
		query, rule.Name, rule.DeviceType, rule.Metric, rule.Operator,
		rule.Threshold, rule.BoolValue, rule.Severity, rule.IsActive, rule.TargetType, rule.TargetID, id,
	)
	return err
}

func (r *AlertRuleRepository) Delete(id int) error {
	_, err := r.db.Exec(`DELETE FROM alert_rules WHERE id = $1`, id)
	return err
}
