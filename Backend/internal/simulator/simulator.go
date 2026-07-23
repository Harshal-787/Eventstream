package simulator

import (
	"database/sql"
	"encoding/json"
	"log"
	"math/rand"
	"strconv"
	"time"

	"github.com/joho/godotenv"

	"eventstream/internal/events"
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"eventstream/internal/services"
)

type Simulator struct {
	db                  *sql.DB
	hub                 *events.Hub
	ruleRepo            *repository.AlertRuleRepository
	anomalyDetector     *services.AnomalyDetector
	notificationService *services.NotificationService
}

func NewSimulator(db *sql.DB, hub *events.Hub, ruleRepo *repository.AlertRuleRepository, anomalyDetector *services.AnomalyDetector, notificationService *services.NotificationService) *Simulator {
	return &Simulator{db: db, hub: hub, ruleRepo: ruleRepo, anomalyDetector: anomalyDetector, notificationService: notificationService}
}

func (s *Simulator) Run() {
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	log.Println("Sensor simulator started...")

	for {
		<-ticker.C

		var isSimulationActive bool
		err := s.db.QueryRow("SELECT is_enabled FROM feature_flags WHERE feature_key = 'simulation_active' AND organization_id IS NULL LIMIT 1").Scan(&isSimulationActive)
		if err == nil && !isSimulationActive {
			continue
		}
		// Fetch active rules once per tick for telemetry generation
		activeRules, err := s.ruleRepo.GetActiveRules()
		if err != nil {
			activeRules = []models.AlertRule{}
		}

		// Fetch active devices that should generate telemetry
		rows, err := s.db.Query("SELECT d.id, d.organization_id, d.type, d.room_id, d.building_id FROM devices d WHERE d.status = 'active'")
		if err != nil {
			log.Printf("simulator: error querying devices: %v", err)
			continue
		}

		for rows.Next() {
			var deviceID int
			var orgID int
			var sensorType string
			var roomID sql.NullInt32
			var buildingID sql.NullInt32
			
			if err := rows.Scan(&deviceID, &orgID, &sensorType, &roomID, &buildingID); err != nil {
				continue
			}

			// Generate fake telemetry based on sensor type
			t := &models.Telemetry{
				DeviceID:       deviceID,
				OrganizationID: orgID,
				Timestamp:      time.Now(),
				Payload:        make(map[string]interface{}),
			}

			status := "ok"
			t.Status = &status

			// Parse dynamically from .env file so user doesn't need to restart server
			envMap, err := godotenv.Read(".env")
			simulateAlerts := false
			spikeProb := 0.05
			
			if err == nil {
				if val, ok := envMap["SIMULATE_ALERTS"]; ok {
					simulateAlerts, _ = strconv.ParseBool(val)
				}
				if val, ok := envMap["SIMULATE_SPIKE_PROBABILITY"]; ok {
					if p, err := strconv.ParseFloat(val, 64); err == nil {
						spikeProb = p
					}
				}
			}

			isSpike := simulateAlerts && rand.Float64() < spikeProb



			var applicableRules []models.AlertRule
			for _, rule := range activeRules {
				// Only evaluate rules matching this device type (unless global 'all')
				if rule.DeviceType != sensorType && rule.DeviceType != "all" {
					continue
				}

				// Check hierarchical target match
				isMatch := false
				if rule.TargetType == "global" {
					isMatch = true
				} else if rule.TargetType == "building" && buildingID.Valid && rule.TargetID != nil && *rule.TargetID == int(buildingID.Int32) {
					isMatch = true
				} else if rule.TargetType == "room" && roomID.Valid && rule.TargetID != nil && *rule.TargetID == int(roomID.Int32) {
					isMatch = true
				} else if rule.TargetType == "device" && rule.TargetID != nil && *rule.TargetID == deviceID {
					isMatch = true
				}

				if isMatch {
					applicableRules = append(applicableRules, rule)
				}
			}

			// Generate safe baseline payload
			temp := 22.0 + (rand.Float64() * 2) - 1 // 21 to 23 C
			hum := 45.0 + (rand.Float64() * 10) - 5 // 40% to 50%
			
			// Simulate battery and signal for all devices
			batt := 85.0 + (rand.Float64() * 10) - 5 // 80 to 95%
			sig := -60.0 + (rand.Float64() * 10) - 5 // -65 to -55 dBm
			t.Payload["battery_pct"] = batt
			t.Payload["signal_strength"] = sig

			switch sensorType {
			case "temperature":
				t.Temperature = &temp
				t.Humidity = &hum
				t.Payload["temperature"] = temp
				t.Payload["humidity"] = hum
			case "humidity":
				t.Humidity = &hum
				t.Payload["humidity"] = hum
			case "temperature_humidity", "multisensor":
				t.Temperature = &temp
				t.Humidity = &hum
				t.Payload["temperature"] = temp
				t.Payload["humidity"] = hum
				if sensorType == "multisensor" {
					t.Payload["motion_detected"] = false
				}
			case "smoke":
				t.Payload["smoke_detected"] = false
			case "water_leak":
				t.Payload["water_detected"] = false
			case "door":
				t.Payload["door_open"] = false
			case "motion":
				t.Payload["motion_detected"] = false
			case "air_quality":
				t.Payload["aqi"] = 40.0 + (rand.Float64() * 10)
			case "power":
				t.Payload["power_usage"] = 1.5 + (rand.Float64() * 0.2)
				t.Payload["voltage"] = 120.0 + (rand.Float64() * 2) - 1
			}

			// If spike, dynamically breach an active rule
			if isSpike && len(applicableRules) > 0 {
				ruleToBreach := applicableRules[rand.Intn(len(applicableRules))]
				
				if ruleToBreach.BoolValue != nil {
					if ruleToBreach.Operator == "==" {
						t.Payload[ruleToBreach.Metric] = *ruleToBreach.BoolValue
					} else if ruleToBreach.Operator == "!=" {
						t.Payload[ruleToBreach.Metric] = !*ruleToBreach.BoolValue
					}
				} else if ruleToBreach.Threshold != nil {
					if ruleToBreach.Operator == ">" {
						t.Payload[ruleToBreach.Metric] = *ruleToBreach.Threshold + (rand.Float64() * 5) + 1.0
					} else if ruleToBreach.Operator == "<" {
						t.Payload[ruleToBreach.Metric] = *ruleToBreach.Threshold - (rand.Float64() * 5) - 1.0
					} else if ruleToBreach.Operator == "==" {
						t.Payload[ruleToBreach.Metric] = *ruleToBreach.Threshold
					}
				}
				
				// Keep Temperature/Humidity struct fields in sync with payload if they were breached
				if val, ok := t.Payload["temperature"].(float64); ok {
					t.Temperature = &val
				}
				if val, ok := t.Payload["humidity"].(float64); ok {
					t.Humidity = &val
				}
			}

			payloadJSON, _ := json.Marshal(t.Payload)

			// Insert into DB
			var id int
			err = s.db.QueryRow(
				`INSERT INTO telemetry (device_id, temperature, humidity, status, payload, timestamp) 
				 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
				t.DeviceID, t.Temperature, t.Humidity, t.Status, string(payloadJSON), t.Timestamp,
			).Scan(&id)

			if err != nil {
				log.Printf("simulator: error saving telemetry: %v", err)
				continue
			}
			t.ID = id

			// Run anomaly detection
			go s.anomalyDetector.Process(t)

			// Broadcast to SSE hub
			s.hub.Broadcast <- &events.StreamEvent{
				Type:    "telemetry",
				Payload: t,
			}

			// --- RULE EVALUATION ENGINE ---
			// We already have activeRules available from the start of the tick.

			for _, rule := range applicableRules {
				// We already filtered activeRules into applicableRules based on hierarchy and device type
				metricVal, exists := t.Payload[rule.Metric]
				if !exists {
					continue
				}

				isBreached := false

				// Evaluate Boolean Rules
				if rule.BoolValue != nil {
					if valBool, ok := metricVal.(bool); ok {
						if rule.Operator == "==" && valBool == *rule.BoolValue {
							isBreached = true
						} else if rule.Operator == "!=" && valBool != *rule.BoolValue {
							isBreached = true
						}
					}
				}

				// Evaluate Numeric Threshold Rules
				if rule.Threshold != nil {
					var valFloat float64
					if v, ok := metricVal.(float64); ok {
						valFloat = v
					} else if v, ok := metricVal.(int); ok {
						valFloat = float64(v)
					}

					if rule.Operator == ">" && valFloat > *rule.Threshold {
						isBreached = true
					} else if rule.Operator == "<" && valFloat < *rule.Threshold {
						isBreached = true
					} else if rule.Operator == "==" && valFloat == *rule.Threshold {
						isBreached = true
					}
				}

				var existingAlertID int
				err := s.db.QueryRow(`SELECT id FROM alerts WHERE device_id = $1 AND alert_rule_id = $2 AND status = 'open'`, deviceID, rule.ID).Scan(&existingAlertID)
				alertExists := (err == nil)

				if isBreached {
					if !alertExists {
						log.Printf("SIMULATOR: Rule %s breached by deviceID=%d!", rule.Name, deviceID)
						var alertID int
						err = s.db.QueryRow(
							`INSERT INTO alerts (device_id, alert_rule_id, type, severity, message, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
							deviceID, rule.ID, rule.Metric, rule.Severity, "Rule Triggered: "+rule.Name, "open",
						).Scan(&alertID)
						
						if err == nil {
							var devName, bName, rName, hardwareID, modelName, fName sql.NullString
							s.db.QueryRow(`
								SELECT d.name, b.name, r.name, d.hardware_id, dm.model_name, f.name
								FROM devices d 
								LEFT JOIN buildings b ON d.building_id = b.id 
								LEFT JOIN rooms r ON d.room_id = r.id 
								LEFT JOIN device_models dm ON d.model_id = dm.id
								LEFT JOIN floors f ON d.floor_id = f.id
								WHERE d.id = $1`, deviceID).Scan(&devName, &bName, &rName, &hardwareID, &modelName, &fName)
								
							s.hub.Broadcast <- &events.StreamEvent{
								Type: "alert",
								Payload: map[string]interface{}{
									"id":           alertID,
									"device_id":    deviceID,
									"device_name":  devName.String,
									"rule_name":    rule.Name,
									"metric":       rule.Metric,
									"severity":     rule.Severity,
									"message":      "Rule Triggered: " + rule.Name,
									"triggered_at": time.Now(),
								},
							}

							if s.notificationService != nil {
								var orgID int
								s.db.QueryRow("SELECT organization_id FROM devices WHERE id = $1", deviceID).Scan(&orgID)
								
								alertModel := &models.Alert{
									ID:             alertID,
									OrganizationID: orgID,
									DeviceID:       &deviceID,
									AlertRuleID:    &rule.ID,
									Type:           "rule",
									Severity:       rule.Severity,
									Status:         "open",
									Message:        "Rule Triggered: " + rule.Name,
									TriggeredAt:    time.Now(),
								}
								s.notificationService.DispatchAlert(alertModel)
							}
						}
					}
				} else {
					if alertExists {
						log.Printf("SIMULATOR: Rule %s condition cleared for deviceID=%d. Resolving alert.", rule.Name, deviceID)
						s.db.Exec(`UPDATE alerts SET status = 'resolved', resolved_at = $1 WHERE id = $2`, time.Now(), existingAlertID)
						
						// Broadcast resolution
						s.hub.Broadcast <- &events.StreamEvent{
							Type: "alert_update",
							Payload: map[string]interface{}{
								"id": existingAlertID,
								"status": "resolved",
							},
						}
					}
				}
			}
		}
		rows.Close()
	}
}
