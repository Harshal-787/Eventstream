package workers

import (
	"database/sql"
	"log"
	"time"
)

type HeartbeatMonitor struct {
	db       *sql.DB
	interval time.Duration
	stopChan chan struct{}
}

func NewHeartbeatMonitor(db *sql.DB, interval time.Duration) *HeartbeatMonitor {
	return &HeartbeatMonitor{
		db:       db,
		interval: interval,
		stopChan: make(chan struct{}),
	}
}

func (m *HeartbeatMonitor) Start() {
	go func() {
		ticker := time.NewTicker(m.interval)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				m.checkHeartbeats()
			case <-m.stopChan:
				return
			}
		}
	}()
}

func (m *HeartbeatMonitor) Stop() {
	close(m.stopChan)
}

func (m *HeartbeatMonitor) checkHeartbeats() {
	// A device is considered offline if it hasn't communicated in the last 5 minutes (or its specific interval)
	// For simplicity, we use a global 5 minute threshold if not specified.
	query := `
		UPDATE devices
		SET status = 'offline'
		WHERE status = 'active'
		AND (
			(last_communication_at < NOW() - INTERVAL '5 minutes')
		)
	`
	res, err := m.db.Exec(query)
	if err != nil {
		log.Printf("HeartbeatMonitor error: %v", err)
		return
	}
	count, _ := res.RowsAffected()
	if count > 0 {
		log.Printf("HeartbeatMonitor: Marked %d devices as offline", count)
	}
}
