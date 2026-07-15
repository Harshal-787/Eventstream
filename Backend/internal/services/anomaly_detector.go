package services

import (
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	"eventstream/internal/models"
	"eventstream/internal/repository"
)

type DeviceStats struct {
	Count    int
	Mean     float64
	Variance float64 // M2 for Welford's algorithm
}

type AnomalyDetector struct {
	alertRepo           *repository.AlertRepository
	notificationService *NotificationService
	tempStats           map[int]*DeviceStats
	humStats            map[int]*DeviceStats
	mu                  sync.RWMutex
}

func NewAnomalyDetector(alertRepo *repository.AlertRepository, notificationService *NotificationService) *AnomalyDetector {
	return &AnomalyDetector{
		alertRepo:           alertRepo,
		notificationService: notificationService,
		tempStats: make(map[int]*DeviceStats),
		humStats:  make(map[int]*DeviceStats),
	}
}

// Process evaluates a new telemetry point against historical stats using Welford's online algorithm
func (ad *AnomalyDetector) Process(t *models.Telemetry) {
	ad.mu.Lock()
	defer ad.mu.Unlock()

	if t.Temperature != nil {
		ad.checkAndObserve(t.DeviceID, t.OrganizationID, "Temperature", *t.Temperature, ad.tempStats)
	}

	if t.Humidity != nil {
		ad.checkAndObserve(t.DeviceID, t.OrganizationID, "Humidity", *t.Humidity, ad.humStats)
	}
}

func (ad *AnomalyDetector) checkAndObserve(deviceID, orgID int, metricName string, value float64, statsMap map[int]*DeviceStats) {
	stats, exists := statsMap[deviceID]
	if !exists {
		stats = &DeviceStats{}
		statsMap[deviceID] = stats
	}

	// If we have enough data points (e.g. > 5), check for anomaly
	if stats.Count > 5 {
		stdDev := math.Sqrt(stats.Variance / float64(stats.Count))
		if stdDev > 0 { // avoid division by zero
			zScore := math.Abs((value - stats.Mean) / stdDev)
			// Threshold of 3 standard deviations
			if zScore > 3.0 {
				log.Printf("[ANOMALY DETECTED] Device %d, %s: value=%.2f, mean=%.2f, stddev=%.2f, z=%.2f", deviceID, metricName, value, stats.Mean, stdDev, zScore)
				ad.createAnomalyAlert(deviceID, orgID, metricName, value, stats.Mean, zScore)
				// Do not include the anomalous point in the stats to avoid poisoning the baseline
				return
			}
		}
	}

	// Welford's online algorithm to update mean and variance
	stats.Count++
	delta := value - stats.Mean
	stats.Mean += delta / float64(stats.Count)
	delta2 := value - stats.Mean
	stats.Variance += delta * delta2
}

func (ad *AnomalyDetector) createAnomalyAlert(deviceID, orgID int, metricName string, value float64, mean float64, zScore float64) {
	alert := &models.Alert{
		OrganizationID: orgID,
		Type:           "anomaly",
		Severity:       "high",
		Status:         "active",
		Message:        fmt.Sprintf("Sudden spike detected in %s (Value: %.2f, Expected Mean: %.2f, Z-Score: %.1f)", metricName, value, mean, zScore),
		TriggeredAt:    time.Now(),
	}

	// DeviceID is a pointer in the model
	if deviceID > 0 {
		alert.DeviceID = &deviceID
	}

	err := ad.alertRepo.Create(alert)
	if err != nil {
		log.Printf("Failed to create anomaly alert: %v", err)
	} else {
		// Dispatch notification if successful
		if ad.notificationService != nil {
			ad.notificationService.DispatchAlert(alert)
		}
	}
}
