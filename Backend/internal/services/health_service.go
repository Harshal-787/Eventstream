package services

import (
	"database/sql"
	"sync"
	"time"
)

type WorkerStatus struct {
	Name      string    `json:"name"`
	LastPing  time.Time `json:"last_ping"`
	IsHealthy bool      `json:"is_healthy"`
}

type HealthMetrics struct {
	Database struct {
		MaxOpenConnections int `json:"max_open_connections"`
		OpenConnections    int `json:"open_connections"`
		InUse              int `json:"in_use"`
		Idle               int `json:"idle"`
		WaitCount          int64 `json:"wait_count"`
	} `json:"database"`
	API struct {
		AverageLatency1h float64 `json:"avg_latency_1h"`
		TotalRequests1h  int     `json:"total_requests_1h"`
	} `json:"api"`
	Queue struct {
		ActiveQueueEvents      int `json:"active_queue_events"`
		DeadLetterQueueEvents  int `json:"dead_letter_queue_events"`
	} `json:"queue"`
	Workers []WorkerStatus `json:"workers"`
}

type HealthService struct {
	db      *sql.DB
	workers map[string]time.Time
	mu      sync.RWMutex
}

func NewHealthService(db *sql.DB) *HealthService {
	return &HealthService{
		db:      db,
		workers: make(map[string]time.Time),
	}
}

func (s *HealthService) PingWorker(workerName string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.workers[workerName] = time.Now()
}

func (s *HealthService) GetSystemHealth() (HealthMetrics, error) {
	var metrics HealthMetrics

	// Database Metrics
	stats := s.db.Stats()
	metrics.Database.MaxOpenConnections = stats.MaxOpenConnections
	metrics.Database.OpenConnections = stats.OpenConnections
	metrics.Database.InUse = stats.InUse
	metrics.Database.Idle = stats.Idle
	metrics.Database.WaitCount = stats.WaitCount

	// API Metrics (last 1h)
	apiQuery := `
		SELECT COALESCE(AVG(duration_ms), 0), COUNT(*)
		FROM api_logs
		WHERE created_at >= NOW() - INTERVAL '1 hour'
	`
	_ = s.db.QueryRow(apiQuery).Scan(&metrics.API.AverageLatency1h, &metrics.API.TotalRequests1h)

	// Queue Metrics
	activeQuery := `
		SELECT COUNT(*)
		FROM telemetry
		WHERE timestamp >= NOW() - INTERVAL '1 hour'
	`
	_ = s.db.QueryRow(activeQuery).Scan(&metrics.Queue.ActiveQueueEvents)

	dlqQuery := `
		SELECT COUNT(*)
		FROM failed_events
	`
	_ = s.db.QueryRow(dlqQuery).Scan(&metrics.Queue.DeadLetterQueueEvents)

	// Worker Status
	s.mu.RLock()
	now := time.Now()
	for name, lastPing := range s.workers {
		// Consider healthy if pinged within last 5 minutes
		isHealthy := now.Sub(lastPing) < 5*time.Minute
		metrics.Workers = append(metrics.Workers, WorkerStatus{
			Name:      name,
			LastPing:  lastPing,
			IsHealthy: isHealthy,
		})
	}
	s.mu.RUnlock()

	return metrics, nil
}
