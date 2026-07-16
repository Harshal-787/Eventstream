package services

import (
	"database/sql"
	"eventstream/internal/repository"
	"fmt"
	"strconv"
	"time"
)

type ReportingService struct {
	db            *sql.DB
	telemetryRepo *repository.TelemetryRepository
	alertRepo     *repository.AlertRepository
	deviceRepo    *repository.DeviceRepo
}

func NewReportingService(db *sql.DB, telemetryRepo *repository.TelemetryRepository, alertRepo *repository.AlertRepository, deviceRepo *repository.DeviceRepo) *ReportingService {
	return &ReportingService{
		db:            db,
		telemetryRepo: telemetryRepo,
		alertRepo:     alertRepo,
		deviceRepo:    deviceRepo,
	}
}

type ReportFilters struct {
	BuildingID *int
	StartDate  *time.Time
	EndDate    *time.Time
}

// Helper to safely apply building filter
func buildBuildingFilter(bId *int, alias string) string {
	if bId == nil {
		return "1=1"
	}
	return fmt.Sprintf("%s.building_id = %d", alias, *bId)
}

// Helper to safely apply timestamp filter
func buildTimeFilter(start, end *time.Time, alias string) string {
	cond := "1=1"
	if start != nil {
		cond += fmt.Sprintf(" AND %s >= '%s'", alias, start.Format(time.RFC3339))
	}
	if end != nil {
		cond += fmt.Sprintf(" AND %s <= '%s'", alias, end.Format(time.RFC3339))
	}
	return cond
}

// 1. Event Statistics
func (s *ReportingService) GetEventStatistics(orgID int, filters ReportFilters) (ReportData, error) {
	query := fmt.Sprintf(`
		SELECT d.type, COUNT(t.id), MAX(t.timestamp)
		FROM telemetry t
		JOIN devices d ON t.device_id = d.id
		WHERE d.organization_id = $1
		  AND %s
		  AND %s
		GROUP BY d.type
		ORDER BY COUNT(t.id) DESC
	`, buildBuildingFilter(filters.BuildingID, "d"), buildTimeFilter(filters.StartDate, filters.EndDate, "t.timestamp"))
	
	rows, err := s.db.Query(query, orgID)
	if err != nil {
		return ReportData{}, err
	}
	defer rows.Close()

	data := ReportData{
		Title:   "Event Statistics Report",
		Headers: []string{"Sensor Type", "Total Events", "Latest Event"},
	}
	for rows.Next() {
		var sType string
		var count int
		var latest *time.Time
		if err := rows.Scan(&sType, &count, &latest); err != nil {
			return ReportData{}, err
		}
		lts := "N/A"
		if latest != nil {
			lts = latest.Format(time.RFC3339)
		}
		data.Rows = append(data.Rows, []string{sType, strconv.Itoa(count), lts})
	}
	return data, nil
}

// 2. Alert Trends
func (s *ReportingService) GetAlertTrends(orgID int, filters ReportFilters) (ReportData, error) {
	// If filtering by building, we need to join devices
	bFilter := "1=1"
	joinDevices := ""
	if filters.BuildingID != nil {
		joinDevices = "JOIN devices d ON a.device_id = d.id"
		bFilter = buildBuildingFilter(filters.BuildingID, "d")
	}

	query := fmt.Sprintf(`
		SELECT a.severity, a.status, COUNT(a.id)
		FROM alerts a
		%s
		WHERE a.organization_id = $1
		  AND %s
		  AND %s
		GROUP BY a.severity, a.status
		ORDER BY a.severity, a.status
	`, joinDevices, bFilter, buildTimeFilter(filters.StartDate, filters.EndDate, "a.created_at"))
	
	rows, err := s.db.Query(query, orgID)
	if err != nil {
		return ReportData{}, err
	}
	defer rows.Close()

	data := ReportData{
		Title:   "Alert Trends Report",
		Headers: []string{"Severity", "Status", "Total Alerts"},
	}
	for rows.Next() {
		var sev, stat string
		var count int
		if err := rows.Scan(&sev, &stat, &count); err != nil {
			return ReportData{}, err
		}
		data.Rows = append(data.Rows, []string{sev, stat, strconv.Itoa(count)})
	}
	return data, nil
}

// 3. Device Availability
func (s *ReportingService) GetDeviceAvailability(orgID int, filters ReportFilters) (ReportData, error) {
	query := fmt.Sprintf(`
		SELECT hardware_id, name, type, status, last_communication_at
		FROM devices
		WHERE organization_id = $1
		  AND %s
		ORDER BY status, last_communication_at DESC
	`, buildBuildingFilter(filters.BuildingID, "devices"))

	rows, err := s.db.Query(query, orgID)
	if err != nil {
		return ReportData{}, err
	}
	defer rows.Close()

	data := ReportData{
		Title:   "Device Availability Report",
		Headers: []string{"Hardware ID", "Name", "Type", "Status", "Last Communication"},
	}
	for rows.Next() {
		var hid, name, typ, status string
		var lastComm sql.NullTime
		if err := rows.Scan(&hid, &name, &typ, &status, &lastComm); err != nil {
			return ReportData{}, err
		}
		lc := "N/A"
		if lastComm.Valid {
			lc = lastComm.Time.Format(time.RFC3339)
		}
		data.Rows = append(data.Rows, []string{hid, name, typ, status, lc})
	}
	return data, nil
}

// 4. Device Health
func (s *ReportingService) GetDeviceHealth(orgID int, filters ReportFilters) (ReportData, error) {
	query := fmt.Sprintf(`
		SELECT hardware_id, name, status, battery_pct, signal_strength, is_maintenance
		FROM devices
		WHERE organization_id = $1
		  AND %s
		ORDER BY battery_pct ASC
	`, buildBuildingFilter(filters.BuildingID, "devices"))

	rows, err := s.db.Query(query, orgID)
	if err != nil {
		return ReportData{}, err
	}
	defer rows.Close()

	data := ReportData{
		Title:   "Device Health Report",
		Headers: []string{"Hardware ID", "Name", "Status", "Battery (%)", "Signal (dBm)", "Maintenance Mode"},
	}
	for rows.Next() {
		var hid, name, status string
		var batt *int
		var sig *float64
		var maint bool
		if err := rows.Scan(&hid, &name, &status, &batt, &sig, &maint); err != nil {
			return ReportData{}, err
		}
		b := "N/A"
		if batt != nil {
			b = strconv.Itoa(*batt)
		}
		sg := "N/A"
		if sig != nil {
			sg = fmt.Sprintf("%.1f", *sig)
		}
		data.Rows = append(data.Rows, []string{hid, name, status, b, sg, strconv.FormatBool(maint)})
	}
	return data, nil
}

// 5. Building Performance
func (s *ReportingService) GetBuildingPerformance(orgID int, filters ReportFilters) (ReportData, error) {
	// Ignore building filter for the overall building performance report
	// Time filter can be applied to alerts if needed, but for simplicity we'll just show current snapshot
	query := `
		SELECT b.name, 
		       COUNT(DISTINCT d.id) as total_devices,
		       COUNT(DISTINCT a.id) as open_alerts
		FROM buildings b
		LEFT JOIN devices d ON d.building_id = b.id
		LEFT JOIN alerts a ON a.device_id = d.id AND a.status = 'open'
		WHERE b.organization_id = $1
		GROUP BY b.id, b.name
		ORDER BY b.name
	`
	rows, err := s.db.Query(query, orgID)
	if err != nil {
		return ReportData{}, err
	}
	defer rows.Close()

	data := ReportData{
		Title:   "Building Performance Report",
		Headers: []string{"Building Name", "Total Devices", "Open Alerts"},
	}
	for rows.Next() {
		var bName string
		var devs, alerts int
		if err := rows.Scan(&bName, &devs, &alerts); err != nil {
			return ReportData{}, err
		}
		data.Rows = append(data.Rows, []string{bName, strconv.Itoa(devs), strconv.Itoa(alerts)})
	}
	return data, nil
}

// 6. Sensor Activity
func (s *ReportingService) GetSensorActivity(orgID int, filters ReportFilters) (ReportData, error) {
	query := fmt.Sprintf(`
		SELECT t.timestamp, d.hardware_id, d.type, t.temperature, t.humidity
		FROM telemetry t
		JOIN devices d ON t.device_id = d.id
		WHERE d.organization_id = $1
		  AND %s
		  AND %s
		ORDER BY t.timestamp DESC
		LIMIT 1000
	`, buildBuildingFilter(filters.BuildingID, "d"), buildTimeFilter(filters.StartDate, filters.EndDate, "t.timestamp"))

	rows, err := s.db.Query(query, orgID)
	if err != nil {
		return ReportData{}, err
	}
	defer rows.Close()

	data := ReportData{
		Title:   "Recent Sensor Activity",
		Headers: []string{"Timestamp", "Hardware ID", "Type", "Temperature", "Humidity"},
	}
	for rows.Next() {
		var ts time.Time
		var hid, typ string
		var temp, hum *float64
		if err := rows.Scan(&ts, &hid, &typ, &temp, &hum); err != nil {
			return ReportData{}, err
		}
		tStr := "N/A"
		if temp != nil {
			tStr = fmt.Sprintf("%.2f", *temp)
		}
		hStr := "N/A"
		if hum != nil {
			hStr = fmt.Sprintf("%.2f", *hum)
		}
		data.Rows = append(data.Rows, []string{ts.Format(time.RFC3339), hid, typ, tStr, hStr})
	}
	return data, nil
}

// 7. User Activity
func (s *ReportingService) GetUserActivity(orgID int, filters ReportFilters) (ReportData, error) {
	query := fmt.Sprintf(`
		SELECT u.name, u.email, u.role, u.status, u.created_at
		FROM users u
		JOIN user_organizations uo ON u.id = uo.user_id
		WHERE uo.organization_id = $1
		  AND %s
		ORDER BY u.created_at DESC
	`, buildTimeFilter(filters.StartDate, filters.EndDate, "u.created_at"))

	rows, err := s.db.Query(query, orgID)
	if err != nil {
		return ReportData{}, err
	}
	defer rows.Close()

	data := ReportData{
		Title:   "User Activity Report",
		Headers: []string{"Name", "Email", "Role", "Status", "Joined Date"},
	}
	for rows.Next() {
		var name, email, role, status string
		var joined time.Time
		if err := rows.Scan(&name, &email, &role, &status, &joined); err != nil {
			return ReportData{}, err
		}
		data.Rows = append(data.Rows, []string{name, email, role, status, joined.Format(time.RFC3339)})
	}
	return data, nil
}

// 8. Audit Logs
func (s *ReportingService) GetAuditLogs(orgID int, filters ReportFilters) (ReportData, error) {
	query := fmt.Sprintf(`
		SELECT a.timestamp, u.email, a.action, a.entity_type, a.entity_id, a.ip_address
		FROM audit_logs a
		JOIN users u ON a.user_id = u.id
		WHERE a.organization_id = $1
		  AND %s
		ORDER BY a.timestamp DESC
		LIMIT 1000
	`, buildTimeFilter(filters.StartDate, filters.EndDate, "a.timestamp"))

	rows, err := s.db.Query(query, orgID)
	if err != nil {
		return ReportData{}, err
	}
	defer rows.Close()

	data := ReportData{
		Title:   "Audit Logs Extract",
		Headers: []string{"Timestamp", "User", "Action", "Entity Type", "Entity ID", "IP Address"},
	}
	for rows.Next() {
		var ts time.Time
		var email, action, etype, ip string
		var eid int
		if err := rows.Scan(&ts, &email, &action, &etype, &eid, &ip); err != nil {
			return ReportData{}, err
		}
		data.Rows = append(data.Rows, []string{ts.Format(time.RFC3339), email, action, etype, strconv.Itoa(eid), ip})
	}
	return data, nil
}
