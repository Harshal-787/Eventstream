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

	// For drift detection
	ShortTermEWMA float64
	LongTermEWMA  float64
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

	if stats.Count == 0 {
		stats.ShortTermEWMA = value
		stats.LongTermEWMA = value
	} else {
		// Update EWMA
		alphaShort := 0.1
		alphaLong := 0.01
		stats.ShortTermEWMA = alphaShort*value + (1-alphaShort)*stats.ShortTermEWMA
		stats.LongTermEWMA = alphaLong*value + (1-alphaLong)*stats.LongTermEWMA
	}

	// If we have enough data points (e.g. > 5), check for anomaly
	if stats.Count > 5 {
		stdDev := math.Sqrt(stats.Variance / float64(stats.Count))
		if stdDev > 0 { // avoid division by zero
			zScore := math.Abs((value - stats.Mean) / stdDev)
			// Threshold of 3 standard deviations
			if zScore > 3.0 {
				log.Printf("[ANOMALY DETECTED] Device %d, %s: value=%.2f, mean=%.2f, stddev=%.2f, z=%.2f", deviceID, metricName, value, stats.Mean, stdDev, zScore)
				ad.createAnomalyAlert(deviceID, orgID, metricName, value, stats.Mean, zScore, "anomaly", "high", fmt.Sprintf("Sudden spike detected in %s (Value: %.2f, Expected Mean: %.2f, Z-Score: %.1f)", metricName, value, stats.Mean, zScore))
				// Do not include the anomalous point in the stats to avoid poisoning the baseline
				return
			}
			
			// Check for drift (short-term vs long-term baseline divergence)
			// A divergence of more than 1.5 standard deviations indicates potential sensor drift
			driftDiff := math.Abs(stats.ShortTermEWMA - stats.LongTermEWMA)
			if driftDiff > (1.5 * stdDev) && stats.Count > 50 { // Need sufficient history for drift
				log.Printf("[SENSOR DRIFT DETECTED] Device %d, %s: shortEWMA=%.2f, longEWMA=%.2f", deviceID, metricName, stats.ShortTermEWMA, stats.LongTermEWMA)
				ad.createAnomalyAlert(deviceID, orgID, metricName, value, stats.LongTermEWMA, driftDiff/stdDev, "sensor_drift", "medium", fmt.Sprintf("Sensor drift detected in %s (Short-term avg: %.2f, Baseline avg: %.2f)", metricName, stats.ShortTermEWMA, stats.LongTermEWMA))
				
				// Reset baseline slightly to avoid spamming drift alerts
				stats.LongTermEWMA = (stats.LongTermEWMA + stats.ShortTermEWMA) / 2
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

func (ad *AnomalyDetector) createAnomalyAlert(deviceID, orgID int, metricName string, value float64, mean float64, score float64, alertType string, severity string, message string) {
	alert := &models.Alert{
		OrganizationID: orgID,
		Type:           alertType,
		Severity:       severity,
		Status:         "active",
		Message:        message,
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
