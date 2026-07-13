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
)

type Simulator struct {
	db  *sql.DB
	hub *events.Hub
}

func NewSimulator(db *sql.DB, hub *events.Hub) *Simulator {
	return &Simulator{db: db, hub: hub}
}

func (s *Simulator) Run() {
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	log.Println("Sensor simulator started...")

	for {
		<-ticker.C

		// Fetch active devices that should generate telemetry
		rows, err := s.db.Query("SELECT d.id, d.type FROM devices d WHERE d.status = 'active'")
		if err != nil {
			log.Printf("simulator: error querying devices: %v", err)
			continue
		}

		for rows.Next() {
			var deviceID int
			var sensorType string
			if err := rows.Scan(&deviceID, &sensorType); err != nil {
				continue
			}

			// Generate fake telemetry based on sensor type
			t := &models.Telemetry{
				DeviceID:  deviceID,
				Timestamp: time.Now(),
				Payload:   make(map[string]interface{}),
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

			var alertType, alertMessage, alertSeverity string

			switch sensorType {
			case "temperature":
				temp := 22.0 + (rand.Float64() * 2) - 1 // 21 to 23 C
				hum := 45.0 + (rand.Float64() * 10) - 5 // 40% to 50%
				if isSpike {
					temp = 32.0 + (rand.Float64() * 4)
					alertType = "temperature_spike"
					alertMessage = "Temperature exceeded safe limits"
					alertSeverity = "critical"
				}
				t.Temperature = &temp
				t.Humidity = &hum
				t.Payload["temperature"] = temp
				t.Payload["humidity"] = hum

			case "humidity":
				hum := 45.0 + (rand.Float64() * 10) - 5 // 40% to 50%
				if isSpike {
					hum = 85.0 + (rand.Float64() * 10)
					alertType = "high_humidity"
					alertMessage = "Humidity level critically high"
					alertSeverity = "warning"
				}
				t.Humidity = &hum
				t.Payload["humidity"] = hum

			case "temperature_humidity", "multisensor":
				temp := 22.0 + (rand.Float64() * 2) - 1
				hum := 45.0 + (rand.Float64() * 10) - 5
				if isSpike {
					temp = 35.0 + (rand.Float64() * 5)
					alertType = "environmental_hazard"
					alertMessage = "Severe environmental anomaly detected"
					alertSeverity = "critical"
				}
				t.Temperature = &temp
				t.Humidity = &hum
				t.Payload["temperature"] = temp
				t.Payload["humidity"] = hum
				if sensorType == "multisensor" {
					t.Payload["motion_detected"] = rand.Float64() < 0.1
				}

			case "smoke":
				smoke := isSpike
				t.Payload["smoke_detected"] = smoke
				if smoke {
					alertType = "smoke_detected"
					alertMessage = "Smoke detected in facility"
					alertSeverity = "critical"
				}

			case "water_leak":
				leak := isSpike
				t.Payload["water_detected"] = leak
				if leak {
					alertType = "water_leak"
					alertMessage = "Water leak detected"
					alertSeverity = "critical"
				}

			case "door":
				doorOpen := rand.Float64() < 0.2 // 20% chance door is open
				t.Payload["door_open"] = doorOpen
				if doorOpen && isSpike {
					alertType = "door_forced"
					alertMessage = "Door forced open"
					alertSeverity = "warning"
				}

			case "motion":
				motion := rand.Float64() < 0.3 // 30% chance motion
				t.Payload["motion_detected"] = motion
				if motion && isSpike {
					alertType = "unauthorized_motion"
					alertMessage = "Unexpected motion detected"
					alertSeverity = "warning"
				}

			case "air_quality":
				aqi := 40.0 + (rand.Float64() * 20) // AQI 40 to 60
				if isSpike {
					aqi = 150.0 + (rand.Float64() * 50)
					alertType = "poor_air_quality"
					alertMessage = "Air quality index critically high"
					alertSeverity = "warning"
				}
				t.Payload["aqi"] = aqi

			case "power":
				power := 1.5 + (rand.Float64() * 0.5) // 1.5kW to 2.0kW
				if isSpike {
					power = 5.0 + (rand.Float64() * 2)
					alertType = "power_surge"
					alertMessage = "Power surge detected"
					alertSeverity = "critical"
				}
				t.Payload["power_usage"] = power
				t.Payload["voltage"] = 120.0 + (rand.Float64() * 4) - 2
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

			// Broadcast to SSE hub
			s.hub.Broadcast <- &events.StreamEvent{
				Type:    "telemetry",
				Payload: t,
			}

			// If spike, create alert
			if alertType != "" {
				log.Printf("SIMULATOR: Generating alert! type=%s, deviceID=%d, simulateAlerts=%v, spikeProb=%v", alertType, deviceID, simulateAlerts, spikeProb)
				var alertID int
				err = s.db.QueryRow(
					`INSERT INTO alerts (device_id, type, severity, message, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
					deviceID, alertType, alertSeverity, alertMessage, "open",
				).Scan(&alertID)
				
				if err == nil {
					// Query to get building/room info for the alert payload (for UI)
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
							"id": alertID,
							"device_id": deviceID,
							"device_name": devName.String,
							"building_name": bName.String,
							"room_name": rName.String,
							"floor_name": fName.String,
							"hardware_id": hardwareID.String,
							"model_name": modelName.String,
							"type": alertType,
							"severity": alertSeverity,
							"message": alertMessage,
							"status": "open",
							"triggered_at": time.Now(),
						},
					}
				}
			}
		}
		rows.Close()
	}
}
