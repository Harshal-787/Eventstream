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
    "context"
    "os"

	"github.com/twilio/twilio-go"
	openapi "github.com/twilio/twilio-go/rest/api/v2010"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
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
		go s.SendToChannel(channel, alert)
	}
}

func (s *NotificationService) SendToChannel(channel models.NotificationChannel, alert *models.Alert) {
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
	// Parse config
	var config map[string]string
	if len(channel.Config) > 0 {
		json.Unmarshal(channel.Config, &config)
	}
	emailAddr := config["email_address"]
	if emailAddr == "" {
		log.Printf("[NOTIFICATION SERVICE - EMAIL] No email address configured for channel %d", channel.ID)
		return
	}
	// Simulate sending email to emailAddr
	log.Printf("[NOTIFICATION SERVICE - EMAIL] Sending to %s: %s", emailAddr, alert.Message)
}

func (s *NotificationService) sendSMS(channel models.NotificationChannel, alert *models.Alert) {
	var config map[string]string
	if len(channel.Config) > 0 {
		json.Unmarshal(channel.Config, &config)
	}
	phone := config["phone_number"]
	if phone == "" {
		log.Printf("[NOTIFICATION SERVICE - SMS] No phone number configured for channel %d", channel.ID)
		return
	}

	// Read credentials from env or config
	accountSid := os.Getenv("TWILIO_ACCOUNT_SID")
	authToken := os.Getenv("TWILIO_AUTH_TOKEN")
	fromPhone := os.Getenv("TWILIO_FROM_PHONE")
	
	if accountSid == "" || authToken == "" || fromPhone == "" {
		// Mock SMS logic if credentials are not present (so it still functions in this demo without crashing)
		log.Printf("[NOTIFICATION SERVICE - SMS] Missing Twilio credentials. Mocking SMS to %s: %s", phone, alert.Message)
		return
	}

	// Real Twilio Binding
	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username: accountSid,
		Password: authToken,
	})

	params := &openapi.CreateMessageParams{}
	params.SetTo(phone)
	params.SetFrom(fromPhone)
	params.SetBody(fmt.Sprintf("[%s Alert] %s", alert.Severity, alert.Message))

	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		log.Printf("[NOTIFICATION SERVICE - SMS] Twilio API Error for channel %d: %v", channel.ID, err)
	} else {
		log.Printf("[NOTIFICATION SERVICE - SMS] Twilio Message sent to %s. SID: %s", phone, *resp.Sid)
	}
}

func (s *NotificationService) sendPush(channel models.NotificationChannel, alert *models.Alert) {
	var config map[string]string
	if len(channel.Config) > 0 {
		json.Unmarshal(channel.Config, &config)
	}
	fcmToken := config["device_token"]
	if fcmToken == "" {
		log.Printf("[NOTIFICATION SERVICE - PUSH] No device_token configured for channel %d", channel.ID)
		return
	}

	// Check if Firebase key is available
	firebaseKeyFile := os.Getenv("FIREBASE_CREDENTIALS_FILE")
	if firebaseKeyFile == "" {
		// Mock Push logic if no credentials
		log.Printf("[NOTIFICATION SERVICE - PUSH] Missing Firebase credentials. Mocking Push to token %s: %s", fcmToken, alert.Message)
		return
	}

	// Real FCM Binding
	ctx := context.Background()
	opt := option.WithCredentialsFile(firebaseKeyFile)
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Printf("[NOTIFICATION SERVICE - PUSH] Firebase Setup Error: %v", err)
		return
	}

	client, err := app.Messaging(ctx)
	if err != nil {
		log.Printf("[NOTIFICATION SERVICE - PUSH] Firebase Messaging Error: %v", err)
		return
	}

	message := &messaging.Message{
		Notification: &messaging.Notification{
			Title: fmt.Sprintf("%s Alert", alert.Severity),
			Body:  alert.Message,
		},
		Token: fcmToken,
	}

	response, err := client.Send(ctx, message)
	if err != nil {
		log.Printf("[NOTIFICATION SERVICE - PUSH] FCM Error for channel %d: %v", channel.ID, err)
	} else {
		log.Printf("[NOTIFICATION SERVICE - PUSH] FCM Message sent to %s. MsgID: %s", fcmToken, response)
	}
}
