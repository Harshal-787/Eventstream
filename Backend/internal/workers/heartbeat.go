package workers

import (
	"database/sql"
	"eventstream/internal/services"
	"log"
	"time"
)

type HeartbeatMonitor struct {
	db        *sql.DB
	interval  time.Duration
	ticker    *time.Ticker
	quit      chan struct{}
	healthSvc *services.HealthService
}

func NewHeartbeatMonitor(db *sql.DB, interval time.Duration, healthSvc *services.HealthService) *HeartbeatMonitor {
	return &HeartbeatMonitor{
		db:        db,
		interval:  interval,
		quit:      make(chan struct{}),
		healthSvc: healthSvc,
	}
}

func (m *HeartbeatMonitor) Start() {
	m.ticker = time.NewTicker(m.interval)
	go func() {
		for {
			select {
			case <-m.ticker.C:
				m.checkHeartbeats()
				m.updateHealthScores()
				if m.healthSvc != nil {
					m.healthSvc.PingWorker("HeartbeatMonitor")
				}
			case <-m.quit:
				m.ticker.Stop()
				return
			}
		}
	}()
}

func (m *HeartbeatMonitor) Stop() {
	close(m.quit)
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

func (m *HeartbeatMonitor) updateHealthScores() {
	query := `
		UPDATE device_twins
		SET health_score = GREATEST(0, 100 - (
			-- Penalty for being offline
			CASE WHEN (SELECT status FROM devices WHERE id = device_twins.device_id) = 'offline' THEN 20 ELSE 0 END
			+
			-- Penalty for open medium alerts
			(SELECT COUNT(*) * 10 FROM alerts WHERE device_id = device_twins.device_id AND status = 'open' AND severity = 'medium')
			+
			-- Penalty for open high/critical alerts
			(SELECT COUNT(*) * 25 FROM alerts WHERE device_id = device_twins.device_id AND status = 'open' AND severity IN ('high', 'critical'))
		))
	`
	res, err := m.db.Exec(query)
	if err != nil {
		log.Printf("HeartbeatMonitor: Failed to update health scores: %v", err)
		return
	}
	
	if rows, err := res.RowsAffected(); err == nil && rows > 0 {
		log.Printf("HeartbeatMonitor: Updated health scores for %d devices", rows)
	}
}
