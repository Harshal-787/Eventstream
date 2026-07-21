package services

import (
	"bytes"
	"encoding/json"
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"fmt"
	"log"
	"net/http"
	"time"
)

type NotificationService struct {
	Repo *repository.NotificationChannelRepo
	client *http.Client
}

func NewNotificationService(repo *repository.NotificationChannelRepo) *NotificationService {
	return &NotificationService{
		Repo: repo,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *NotificationService) DispatchAlert(alert *models.Alert) {
	if alert == nil {
		return
	}

	channels, err := s.Repo.GetActiveByOrg(alert.OrganizationID)
	if err != nil {
		log.Printf("Failed to get notification channels for org %d: %v", alert.OrganizationID, err)
		return
	}

	for _, channel := range channels {
		go s.sendNotification(channel, alert)
	}
}

func (s *NotificationService) sendNotification(channel models.NotificationChannel, alert *models.Alert) {
	var payload []byte
	var err error

	switch channel.Type {
	case "slack":
		payload, err = buildSlackPayload(alert)
	case "teams":
		payload, err = buildTeamsPayload(alert)
	case "email":
		s.sendEmail(channel, alert)
		return
	case "sms":
		s.sendSMS(channel, alert)
		return
	case "push":
		s.sendPush(channel, alert)
		return
	default:
		// Generic webhook
		payload, err = json.Marshal(alert)
	}

	if err != nil {
		log.Printf("Failed to build notification payload for channel %d: %v", channel.ID, err)
		return
	}

	req, err := http.NewRequest("POST", channel.WebhookURL, bytes.NewBuffer(payload))
	if err != nil {
		log.Printf("Failed to create request for channel %d: %v", channel.ID, err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		log.Printf("Failed to send notification to channel %d: %v", channel.ID, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		log.Printf("Received non-200 response from channel %d: %d", channel.ID, resp.StatusCode)
	}
}

func buildSlackPayload(alert *models.Alert) ([]byte, error) {
	color := "#36a64f"
	if alert.Severity == "Critical" {
		color = "#ff0000"
	} else if alert.Severity == "Warning" {
		color = "#ffcc00"
	}

	msg := map[string]interface{}{
		"attachments": []map[string]interface{}{
			{
				"fallback": fmt.Sprintf("[%s] %s", alert.Severity, alert.Message),
				"color":    color,
				"title":    fmt.Sprintf("Alert: %s", alert.Severity),
				"text":     alert.Message,
				"fields": []map[string]interface{}{
					{
						"title": "Device ID",
						"value": fmt.Sprintf("%v", alert.DeviceID),
						"short": true,
					},
					{
						"title": "Rule ID",
						"value": fmt.Sprintf("%v", alert.AlertRuleID),
						"short": true,
					},
				},
				"footer": "EventStream Alert Engine",
				"ts":     alert.TriggeredAt.Unix(),
			},
		},
	}
	return json.Marshal(msg)
}

func buildTeamsPayload(alert *models.Alert) ([]byte, error) {
	color := "008000"
	if alert.Severity == "Critical" {
		color = "FF0000"
	} else if alert.Severity == "Warning" {
		color = "FFA500"
	}

	msg := map[string]interface{}{
		"@type":      "MessageCard",
		"@context":   "http://schema.org/extensions",
		"themeColor": color,
		"summary":    fmt.Sprintf("Alert: %s", alert.Severity),
		"sections": []map[string]interface{}{
			{
				"activityTitle":    fmt.Sprintf("[%s] %s", alert.Severity, alert.Message),
				"activitySubtitle": fmt.Sprintf("Device ID: %v | Rule ID: %v", alert.DeviceID, alert.AlertRuleID),
				"text":             "Please investigate this alert in the dashboard.",
			},
		},
	}
	return json.Marshal(msg)
}

func (s *NotificationService) sendEmail(channel models.NotificationChannel, alert *models.Alert) {
	// Mock SMTP sending
	log.Printf("[NOTIFICATION SERVICE - EMAIL] Sending to %s: %s", channel.WebhookURL, alert.Message)
}

func (s *NotificationService) sendSMS(channel models.NotificationChannel, alert *models.Alert) {
	// Mock Twilio SMS sending
	log.Printf("[NOTIFICATION SERVICE - SMS] Sending to %s: %s", channel.WebhookURL, alert.Message)
}

func (s *NotificationService) sendPush(channel models.NotificationChannel, alert *models.Alert) {
	// Mock FCM Push Notification sending
	log.Printf("[NOTIFICATION SERVICE - PUSH] Sending to %s: %s", channel.WebhookURL, alert.Message)
}
