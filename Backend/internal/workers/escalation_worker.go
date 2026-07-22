package workers

import (
	"database/sql"
	"eventstream/internal/models"
	"eventstream/internal/services"
	"log"
	"time"
)

type EscalationWorker struct {
	db                  *sql.DB
	notificationService *services.NotificationService
	healthService       *services.HealthService
}

func NewEscalationWorker(db *sql.DB, notificationService *services.NotificationService, healthService *services.HealthService) *EscalationWorker {
	return &EscalationWorker{
		db:                  db,
		notificationService: notificationService,
		healthService:       healthService,
	}
}

func (w *EscalationWorker) Start(interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for {
			select {
			case <-ticker.C:
				if w.healthService != nil {
					w.healthService.PingWorker("EscalationWorker")
				}
				w.checkEscalations()
			}
		}
	}()
}

func (w *EscalationWorker) checkEscalations() {
	query := `
		SELECT a.id, a.device_id, a.alert_rule_id, a.type, a.severity, a.status, a.message, a.triggered_at, a.organization_id,
		       ep.notification_channel_id, ep.wait_minutes
		FROM alerts a
		JOIN alert_rules ar ON a.alert_rule_id = ar.id
		JOIN escalation_policies ep ON ar.escalation_policy_id = ep.id
		WHERE a.status = 'open' AND a.escalated = false
		  AND a.triggered_at <= NOW() - INTERVAL '1 minute' * ep.wait_minutes
	`
	rows, err := w.db.Query(query)
	if err != nil {
		log.Printf("EscalationWorker: error querying alerts for escalation: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var a models.Alert
		var channelID int
		var waitMinutes int

		err := rows.Scan(
			&a.ID, &a.DeviceID, &a.AlertRuleID, &a.Type, &a.Severity, &a.Status, &a.Message, &a.TriggeredAt, &a.OrganizationID,
			&channelID, &waitMinutes,
		)
		if err != nil {
			log.Printf("EscalationWorker: error scanning alert row: %v", err)
			continue
		}

		// Dispatch to specific notification channel
		w.escalateAlert(&a, channelID, waitMinutes)
	}
}

func (w *EscalationWorker) escalateAlert(alert *models.Alert, channelID int, waitMinutes int) {
	log.Printf("EscalationWorker: Escalating alert %d after %d minutes of being unacknowledged.", alert.ID, waitMinutes)

	// Fetch channel details
	var nc models.NotificationChannel
	query := `SELECT id, organization_id, name, type, webhook_url, config, is_active FROM notification_channels WHERE id = $1`
	err := w.db.QueryRow(query, channelID).Scan(&nc.ID, &nc.OrganizationID, &nc.Name, &nc.Type, &nc.WebhookURL, &nc.Config, &nc.IsActive)
	if err != nil {
		log.Printf("EscalationWorker: failed to fetch channel %d: %v", channelID, err)
		return
	}

	if !nc.IsActive {
		log.Printf("EscalationWorker: channel %d is inactive, skipping escalation.", channelID)
		return
	}

	// Mocking a Dispatch specifically to this channel. The notification service usually broadcasts to all active org channels.
	// But since we want to send it just to the escalation channel, we use an exported method or mock it directly.
	// For simplicity, we'll expose a SendToChannel method in NotificationService.
	w.notificationService.SendToChannel(nc, alert)

	// Mark as escalated
	_, err = w.db.Exec(`UPDATE alerts SET escalated = true WHERE id = $1`, alert.ID)
	if err != nil {
		log.Printf("EscalationWorker: failed to mark alert %d as escalated: %v", alert.ID, err)
	}
}
