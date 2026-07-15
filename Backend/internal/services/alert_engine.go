package services

import (
	"fmt"
	"log"
	"strings"

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

		// 2. Extract the metric value from telemetry payload
		valRaw, exists := telemetry.Payload[rule.Metric]
		if !exists {
			continue
		}

		// 3. Evaluate the condition
		isTriggered := false
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
			// String evaluation (e.g. status == "offline")
			isTriggered = e.evaluateString(valStr, rule.Operator)
			// Wait, the rule model doesn't have a string value field. 
			// In EventStream, usually bool or threshold is used. 
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
	}
	return false
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
