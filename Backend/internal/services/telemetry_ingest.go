package services

import (
	"crypto/sha256"
	"encoding/json"
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"fmt"
	"sync"
	"time"
)

type lastEventInfo struct {
	Hash      string
	Timestamp time.Time
}

type TelemetryIngestService struct {
	telemetryRepo   *repository.TelemetryRepository
	deviceRepo      *repository.DeviceRepo
	anomalyDetector *AnomalyDetector
	alertEngine     *AlertEngine
	lastEventCache  sync.Map
}

func NewTelemetryIngestService(telemetryRepo *repository.TelemetryRepository, deviceRepo *repository.DeviceRepo, anomalyDetector *AnomalyDetector, alertEngine *AlertEngine) *TelemetryIngestService {
	return &TelemetryIngestService{
		telemetryRepo:   telemetryRepo,
		deviceRepo:      deviceRepo,
		anomalyDetector: anomalyDetector,
		alertEngine:     alertEngine,
	}
}

func (s *TelemetryIngestService) Ingest(tel *models.Telemetry) error {
	// 0. Deduplication filter (Drop exact payload matches within 2 seconds)
	payloadBytes, _ := json.Marshal(tel.Payload)
	hash := fmt.Sprintf("%x", sha256.Sum256(payloadBytes))
	
	if val, ok := s.lastEventCache.Load(tel.DeviceID); ok {
		info := val.(lastEventInfo)
		if info.Hash == hash && time.Since(info.Timestamp) < 2*time.Second {
			// Duplicate event detected, dropping
			return nil
		}
	}
	s.lastEventCache.Store(tel.DeviceID, lastEventInfo{Hash: hash, Timestamp: time.Now()})

	// 1. Save telemetry
	if err := s.telemetryRepo.Insert(tel); err != nil {
		return err
	}

	// 2. Extract battery and update device last communication
	var batteryPct *int
	if b, ok := tel.Payload["battery"].(float64); ok {
		val := int(b)
		batteryPct = &val
	} else if b, ok := tel.Payload["vbat"].(float64); ok {
		val := int(b)
		batteryPct = &val
	} else if b, ok := tel.Payload["battery_level"].(float64); ok {
		val := int(b)
		batteryPct = &val
	}

	// 3. Update device (we can use a lightweight query or just execute raw SQL here)
	if batteryPct != nil {
		s.deviceRepo.DB.Exec(`UPDATE devices SET battery_pct = $1, last_communication_at = NOW(), status = 'active' WHERE id = $2`, *batteryPct, tel.DeviceID)
	} else {
		s.deviceRepo.DB.Exec(`UPDATE devices SET last_communication_at = NOW(), status = 'active' WHERE id = $1`, tel.DeviceID)
	}

	// 4. Background processing
	if s.anomalyDetector != nil {
		go s.anomalyDetector.Process(tel)
	}
	if s.alertEngine != nil {
		go s.alertEngine.Evaluate(tel)
	}

	return nil
}
