package services

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"eventstream/internal/models"
	"eventstream/internal/repository"
)

type AlertEngine struct {
	alertRuleRepo       *repository.AlertRuleRepository
	alertRepo           *repository.AlertRepository
	deviceRepo          *repository.DeviceRepo
	notificationService *NotificationService
}

func NewAlertEngine(
	alertRuleRepo *repository.AlertRuleRepository,
	alertRepo *repository.AlertRepository,
	deviceRepo *repository.DeviceRepo,
	notificationService *NotificationService,
) *AlertEngine {
	return &AlertEngine{
		alertRuleRepo:       alertRuleRepo,
		alertRepo:           alertRepo,
		deviceRepo:          deviceRepo,
		notificationService: notificationService,
	}
}

func (e *AlertEngine) Evaluate(telemetry *models.Telemetry) {
	device, err := e.deviceRepo.GetDeviceByID(telemetry.DeviceID)
	if err != nil {
		log.Printf("AlertEngine: could not fetch device %d: %v", telemetry.DeviceID, err)
		return
	}

	if device.IsMaintenance {
		// Do not process alerts for devices in maintenance mode
		return
	}

	rules, err := e.alertRuleRepo.GetActiveRules()
	if err != nil {
		log.Printf("AlertEngine: could not fetch active rules: %v", err)
		return
	}

	for _, rule := range rules {
		// 1. Check if rule applies to this device based on TargetType
		if !e.appliesToDevice(&rule, device) {
			continue
		}

		// 1.5 Evaluate Time Windows
		if len(rule.TimeWindows) > 0 {
			var windows []map[string]interface{}
			if err := json.Unmarshal(rule.TimeWindows, &windows); err == nil {
				if !e.evaluateTimeWindows(windows, telemetry.Timestamp) {
					continue
				}
			}
		}

		// 2. Evaluate conditions
		isTriggered := false

		if len(rule.Conditions) > 0 {
			var conditions []map[string]interface{}
			if err := json.Unmarshal(rule.Conditions, &conditions); err == nil {
				isTriggered = e.evaluateMultiCondition(conditions, telemetry)
			} else {
				log.Printf("AlertEngine: failed to parse conditions for rule %d", rule.ID)
			}
		} else {
			// Legacy single condition fallback
			valRaw, exists := telemetry.Payload[rule.Metric]
			if exists {
				if rule.Threshold != nil {
					// Numeric evaluation
					if valNum, ok := valRaw.(float64); ok {
						isTriggered = e.evaluateNumeric(valNum, rule.Operator, *rule.Threshold)
					}
				} else if rule.BoolValue != nil {
					// Boolean evaluation
					if valBool, ok := valRaw.(bool); ok {
						isTriggered = (valBool == *rule.BoolValue)
					}
				} else if valStr, ok := valRaw.(string); ok {
					isTriggered = e.evaluateString(valStr, rule.Operator)
				}
			}
		}

		if isTriggered {
			e.triggerAlert(&rule, telemetry, device)
		}
	}
}

func (e *AlertEngine) appliesToDevice(rule *models.AlertRule, device *models.Device) bool {
	if rule.DeviceType != "" && rule.DeviceType != device.Type {
		return false
	}

	switch rule.TargetType {
	case "global":
		return true
	case "building":
		if rule.TargetID != nil && device.BuildingID != nil && *rule.TargetID == *device.BuildingID {
			return true
		}
	case "room":
		if rule.TargetID != nil && device.RoomID != nil && *rule.TargetID == *device.RoomID {
			return true
		}
	case "device":
		if rule.TargetID != nil && *rule.TargetID == device.ID {
			return true
		}
	case "group":
		if rule.TargetID != nil && device.DeviceGroupID != nil && *rule.TargetID == *device.DeviceGroupID {
			return true
		}
	}
	return false
}

func (e *AlertEngine) evaluateTimeWindows(windows []map[string]interface{}, ts time.Time) bool {
	if len(windows) == 0 {
		return true
	}
	weekday := int(ts.Weekday())
	for _, w := range windows {
		if days, ok := w["days"].([]interface{}); ok {
			dayMatched := false
			for _, d := range days {
				if int(d.(float64)) == weekday {
					dayMatched = true
					break
				}
			}
			if !dayMatched {
				continue
			}
		}
		startStr, okStart := w["start_time"].(string)
		endStr, okEnd := w["end_time"].(string)
		if okStart && okEnd {
			currentHM := fmt.Sprintf("%02d:%02d", ts.Hour(), ts.Minute())
			if currentHM >= startStr && currentHM <= endStr {
				return true
			}
		} else {
			return true
		}
	}
	return false
}

func (e *AlertEngine) evaluateMultiCondition(conditions []map[string]interface{}, telemetry *models.Telemetry) bool {
	if len(conditions) == 0 {
		return false
	}
	// By default, treat as AND (all conditions must pass)
	for _, cond := range conditions {
		metricRaw, okMetric := cond["metric"].(string)
		opRaw, okOp := cond["operator"].(string)
		valRaw, okVal := cond["value"]
		
		if !okMetric || !okOp || !okVal {
			continue
		}

		telemetryVal, exists := telemetry.Payload[metricRaw]
		if !exists {
			return false // Metric missing -> fails AND condition
		}

		// Type-based evaluation
		passed := false
		if numTarget, ok := valRaw.(float64); ok {
			if numVal, ok := telemetryVal.(float64); ok {
				passed = e.evaluateNumeric(numVal, opRaw, numTarget)
			}
		} else if boolTarget, ok := valRaw.(bool); ok {
			if boolVal, ok := telemetryVal.(bool); ok {
				passed = (boolVal == boolTarget)
			}
		} else if strTarget, ok := valRaw.(string); ok {
			if strVal, ok := telemetryVal.(string); ok {
				if opRaw == "==" {
					passed = (strVal == strTarget)
				} else if opRaw == "!=" {
					passed = (strVal != strTarget)
				}
			}
		}

		if !passed {
			return false
		}
	}
	return true
}

func (e *AlertEngine) evaluateNumeric(val float64, operator string, threshold float64) bool {
	switch operator {
	case ">":
		return val > threshold
	case "<":
		return val < threshold
	case ">=":
		return val >= threshold
	case "<=":
		return val <= threshold
	case "==":
		return val == threshold
	case "!=":
		return val != threshold
	}
	return false
}

func (e *AlertEngine) evaluateString(val string, operator string) bool {
	// e.g. rule.Operator could store "== offline"
	parts := strings.SplitN(operator, " ", 2)
	if len(parts) == 2 {
		op := parts[0]
		target := parts[1]
		if op == "==" {
			return val == target
		} else if op == "!=" {
			return val != target
		}
	}
	return false
}

func (e *AlertEngine) triggerAlert(rule *models.AlertRule, telemetry *models.Telemetry, device *models.Device) {
	// Check if an OPEN alert already exists for this rule and device
	filters := map[string]interface{}{
		"status":    "open",
		"device_id": fmt.Sprintf("%d", device.ID),
		"rule_id":   fmt.Sprintf("%d", rule.ID),
	}
	existing, err := e.alertRepo.List(filters)
	if err == nil && len(existing) > 0 {
		// Alert already exists and is open, don't create a duplicate
		return
	}

	// Check suppression window
	if rule.SuppressionWin > 0 {
		filtersAny := map[string]interface{}{
			"device_id": fmt.Sprintf("%d", device.ID),
			"rule_id":   fmt.Sprintf("%d", rule.ID),
		}
		latestAlerts, err := e.alertRepo.List(filtersAny)
		if err == nil && len(latestAlerts) > 0 {
			var latest time.Time
			for _, a := range latestAlerts {
				if a.TriggeredAt.After(latest) {
					latest = a.TriggeredAt
				}
			}
			if time.Since(latest) < time.Duration(rule.SuppressionWin)*time.Minute {
				log.Printf("AlertEngine: Suppressing alert for rule %d due to %d min window", rule.ID, rule.SuppressionWin)
				return
			}
		}
	}

	valRaw, _ := telemetry.Payload[rule.Metric]
	message := fmt.Sprintf("Rule '%s' triggered. Metric '%s' value %v violates condition.", rule.Name, rule.Metric, valRaw)

	alert := &models.Alert{
		OrganizationID: device.OrganizationID,
		AlertRuleID:  &rule.ID,
		DeviceID:     &device.ID,
		Severity:     rule.Severity,
		Message:      message,
		Status:       "open",
		Type:         "rule_triggered",
	}

	err = e.alertRepo.Create(alert)
	if err != nil {
		log.Printf("AlertEngine: failed to create alert: %v", err)
		return
	}

	log.Printf("AlertEngine: Alert created (ID: %d) for device %d (Rule: %s)", alert.ID, device.ID, rule.Name)

	// Dispatch notifications asynchronously
	go func() {
		e.notificationService.DispatchAlert(alert)
	}()
}
