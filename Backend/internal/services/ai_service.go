package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"eventstream/internal/models"
	"eventstream/internal/repository"
	"fmt"
	"io"
	"net/http"
)

type AIService struct {
	configRepo *repository.AIConfigRepo
}

func NewAIService(configRepo *repository.AIConfigRepo) *AIService {
	return &AIService{configRepo: configRepo}
}

// Generates a summary for a batch of events
func (s *AIService) GenerateSummary(organizationID int, events []models.Telemetry) (string, error) {
	if len(events) == 0 {
		return "No events to summarize.", nil
	}

	cfg, err := s.configRepo.GetActiveConfig(organizationID)
	if err != nil {
		return "", err
	}
	if cfg == nil {
		return "", errors.New("no active AI configuration found for this organization")
	}

	prompt := "Please summarize the following IoT telemetry events and highlight any critical anomalies or trends:\n"
	for _, e := range events {
		payloadBytes, _ := json.Marshal(e.Payload)
		prompt += fmt.Sprintf("- Device %d at %s: %s\n", e.DeviceID, e.Timestamp.Format("2006-01-02 15:04:05"), string(payloadBytes))
	}

	return s.callProvider(cfg, prompt)
}

// Analyzes root cause for an alert given its context
func (s *AIService) AnalyzeRootCause(organizationID int, alert *models.Alert, contextEvents []models.Telemetry) (string, error) {
	cfg, err := s.configRepo.GetActiveConfig(organizationID)
	if err != nil {
		return "", err
	}
	if cfg == nil {
		return "", errors.New("no active AI configuration found for this organization")
	}

	prompt := fmt.Sprintf("Analyze the root cause for this alert:\nAlert Message: %s\nSeverity: %s\n\nContext Events leading up to this:\n", alert.Message, alert.Severity)
	for _, e := range contextEvents {
		payloadBytes, _ := json.Marshal(e.Payload)
		prompt += fmt.Sprintf("- Device %d at %s: %s\n", e.DeviceID, e.Timestamp.Format("2006-01-02 15:04:05"), string(payloadBytes))
	}
	prompt += "\nPlease provide a succinct root cause analysis and recommended next steps."

	return s.callProvider(cfg, prompt)
}

// Predicts maintenance needs for a device based on history
func (s *AIService) PredictiveMaintenance(organizationID int, device *models.Device, history []models.Telemetry) (string, error) {
	cfg, err := s.configRepo.GetActiveConfig(organizationID)
	if err != nil {
		return "", err
	}
	if cfg == nil {
		return "", errors.New("no active AI configuration found for this organization")
	}

	prompt := fmt.Sprintf("Predict maintenance needs for the following device:\nDevice: %s (Type: %s)\nStatus: %s\nBattery: %d%%\n\nRecent History:\n", device.Name, device.Type, device.Status, *device.BatteryPct)
	for _, e := range history {
		payloadBytes, _ := json.Marshal(e.Payload)
		prompt += fmt.Sprintf("- %s: %s\n", e.Timestamp.Format("2006-01-02 15:04:05"), string(payloadBytes))
	}
	prompt += "\nDoes this device show signs of sensor drift, impending battery failure, or other maintenance needs? Provide a brief analysis."

	return s.callProvider(cfg, prompt)
}

func (s *AIService) callProvider(cfg *models.AIConfiguration, prompt string) (string, error) {
	switch cfg.ProviderType {
	case "gemini":
		return s.callGemini(cfg, prompt)
	case "openai":
		return s.callOpenAI(cfg, prompt)
	default:
		return "", fmt.Errorf("unsupported AI provider: %s", cfg.ProviderType)
	}
}

func (s *AIService) callGemini(cfg *models.AIConfiguration, prompt string) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", cfg.ModelName, cfg.APIKey)
	
	reqBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
	}
	
	bodyBytes, _ := json.Marshal(reqBody)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("gemini API error: %s", string(respBytes))
	}

	var resData map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&resData); err != nil {
		return "", err
	}

	// Extract text
	candidates := resData["candidates"].([]interface{})
	if len(candidates) > 0 {
		cand := candidates[0].(map[string]interface{})
		content := cand["content"].(map[string]interface{})
		parts := content["parts"].([]interface{})
		if len(parts) > 0 {
			part := parts[0].(map[string]interface{})
			return part["text"].(string), nil
		}
	}

	return "", errors.New("empty response from Gemini")
}

func (s *AIService) callOpenAI(cfg *models.AIConfiguration, prompt string) (string, error) {
	url := "https://api.openai.com/v1/chat/completions"
	
	reqBody := map[string]interface{}{
		"model": cfg.ModelName,
		"messages": []map[string]interface{}{
			{"role": "user", "content": prompt},
		},
	}
	
	bodyBytes, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.APIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("openai API error: %s", string(respBytes))
	}

	var resData map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&resData); err != nil {
		return "", err
	}

	choices := resData["choices"].([]interface{})
	if len(choices) > 0 {
		choice := choices[0].(map[string]interface{})
		message := choice["message"].(map[string]interface{})
		return message["content"].(string), nil
	}

	return "", errors.New("empty response from OpenAI")
}
