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
	// 1. Find devices that are about to go offline
	querySelect := `
		SELECT id, organization_id, name FROM devices
		WHERE status = 'active'
		AND last_communication_at < NOW() - INTERVAL '5 minutes'
	`
	rows, err := m.db.Query(querySelect)
	if err != nil {
		log.Printf("HeartbeatMonitor error: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, orgID int
		var name string
		if err := rows.Scan(&id, &orgID, &name); err == nil {
			// Mark offline
			m.db.Exec(`UPDATE devices SET status = 'offline' WHERE id = $1`, id)
			
			// Generate Missing Event Alert
			alertQuery := `INSERT INTO alerts (organization_id, device_id, type, severity, status, message, triggered_at)
						   VALUES ($1, $2, 'missing_event', 'medium', 'open', $3, NOW())`
			m.db.Exec(alertQuery, orgID, id, "Device "+name+" missed expected heartbeat and is now offline.")
			log.Printf("HeartbeatMonitor: Marked device %d (%s) as offline", id, name)
		}
	}
}
