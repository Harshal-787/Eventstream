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

	prompt := fmt.Sprintf("You are an expert site reliability engineer (SRE) and IoT systems analyst. Analyze the root cause for this alert in a highly professional, objective tone:\nAlert Message: %s\nSeverity: %s\n\nContext Events leading up to this:\n", alert.Message, alert.Severity)
	for _, e := range contextEvents {
		payloadBytes, _ := json.Marshal(e.Payload)
		prompt += fmt.Sprintf("- Device %d at %s: %s\n", e.DeviceID, e.Timestamp.Format("2006-01-02 15:04:05"), string(payloadBytes))
	}
	prompt += "\nPlease provide a succinct, highly professional root cause analysis and recommended next steps using clear markdown formatting."

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

	prompt := fmt.Sprintf("You are an expert IoT maintenance engineer. Predict maintenance needs for the following device using a highly professional and analytical tone:\nDevice: %s (Type: %s)\nStatus: %s\nBattery: %d%%\n\nRecent History:\n", device.Name, device.Type, device.Status, *device.BatteryPct)
	for _, e := range history {
		payloadBytes, _ := json.Marshal(e.Payload)
		prompt += fmt.Sprintf("- %s: %s\n", e.Timestamp.Format("2006-01-02 15:04:05"), string(payloadBytes))
	}
	prompt += "\nDoes this device show signs of sensor drift, impending battery failure, or other maintenance needs? Provide a brief, professional analysis using markdown."

	return s.callProvider(cfg, prompt)
}

// Generates a comprehensive health summary for a device
func (s *AIService) GenerateDeviceHealthSummary(organizationID int, device *models.Device, history []models.Telemetry) (string, error) {
	cfg, err := s.configRepo.GetActiveConfig(organizationID)
	if err != nil {
		return "", err
	}
	if cfg == nil {
		return "", errors.New("no active AI configuration found for this organization")
	}

	prompt := fmt.Sprintf("You are a professional IoT systems analyst. Generate a detailed, highly professional health summary for the following device:\nDevice: %s (Type: %s)\nStatus: %s\nBattery: %d%%\n\nRecent History:\n", device.Name, device.Type, device.Status, *device.BatteryPct)
	for _, e := range history {
		payloadBytes, _ := json.Marshal(e.Payload)
		prompt += fmt.Sprintf("- %s: %s\n", e.Timestamp.Format("2006-01-02 15:04:05"), string(payloadBytes))
	}
	prompt += "\nPlease provide a comprehensive health summary, noting any erratic behavior, sensor drift, and general operational status. Structure your response professionally using markdown headers and bullet points."

	return s.callProvider(cfg, prompt)
}

// Generates an executive operational report
func (s *AIService) GenerateExecutiveReport(organizationID int, alerts []*models.Alert, events []models.Telemetry) (string, error) {
	cfg, err := s.configRepo.GetActiveConfig(organizationID)
	if err != nil {
		return "", err
	}
	if cfg == nil {
		return "", errors.New("no active AI configuration found for this organization")
	}

	prompt := "You are a Chief Operations Officer (COO) AI Assistant. Generate an executive operational report for the recent system activity in a highly professional, corporate tone.\n\nRecent Alerts:\n"
	for _, a := range alerts {
		prompt += fmt.Sprintf("- [%s] %s (Device ID: %v)\n", a.Severity, a.Message, a.DeviceID)
	}
	prompt += "\nRecent Telemetry Events:\n"
	for _, e := range events {
		payloadBytes, _ := json.Marshal(e.Payload)
		prompt += fmt.Sprintf("- Device %d at %s: %s\n", e.DeviceID, e.Timestamp.Format("2006-01-02 15:04:05"), string(payloadBytes))
	}
	prompt += "\nProvide a high-level summary suitable for an executive board, highlighting key issues, system stability, and recommended strategic actions. Structure your response using markdown with clear headings (e.g., Executive Summary, Key Anomalies, Strategic Recommendations)."

	return s.callProvider(cfg, prompt)
}

// Generates an incident summary
func (s *AIService) GenerateIncidentSummary(organizationID int, incidentID int, alerts []*models.Alert) (string, error) {
	cfg, err := s.configRepo.GetActiveConfig(organizationID)
	if err != nil {
		return "", err
	}
	if cfg == nil {
		return "", errors.New("no active AI configuration found for this organization")
	}

	prompt := fmt.Sprintf("Generate a post-mortem incident summary for Incident ID: %d.\n\nRelated Alerts:\n", incidentID)
	for _, a := range alerts {
		prompt += fmt.Sprintf("- [%s] %s (Triggered: %s)\n", a.Severity, a.Message, a.TriggeredAt.Format("2006-01-02 15:04:05"))
	}
	prompt += "\nPlease provide a chronological summary of the incident, its impact, and suggested preventative measures."

	return s.callProvider(cfg, prompt)
}

// Chat handles generic conversation with the AI provider
func (s *AIService) Chat(organizationID int, prompt string) (string, error) {
	cfg, err := s.configRepo.GetActiveConfig(organizationID)
	if err != nil {
		return "", err
	}
	if cfg == nil {
		return "", errors.New("no active AI configuration found for this organization")
	}

	// Just pass the prompt directly to the provider
	return s.callProvider(cfg, prompt)
}

func (s *AIService) callProvider(cfg *models.AIConfiguration, prompt string) (string, error) {
	switch cfg.ProviderType {
	case "gemini":
		return s.callGemini(cfg, prompt)
	case "openai":
		return s.callOpenAI(cfg, prompt)
	case "anthropic":
		return s.callAnthropic(cfg, prompt)
	case "azure":
		return s.callAzure(cfg, prompt)
	case "ollama":
		return s.callOllama(cfg, prompt)
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

func (s *AIService) callAnthropic(cfg *models.AIConfiguration, prompt string) (string, error) {
	url := "https://api.anthropic.com/v1/messages"
	
	reqBody := map[string]interface{}{
		"model": cfg.ModelName,
		"max_tokens": 1024,
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
	req.Header.Set("x-api-key", cfg.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("anthropic API error: %s", string(respBytes))
	}

	var resData map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&resData); err != nil {
		return "", err
	}

	content, ok := resData["content"].([]interface{})
	if ok && len(content) > 0 {
		part := content[0].(map[string]interface{})
		return part["text"].(string), nil
	}

	return "", errors.New("empty response from Anthropic")
}

func (s *AIService) callAzure(cfg *models.AIConfiguration, prompt string) (string, error) {
	url := "https://api.openai.com/v1/chat/completions" // placeholder for Azure endpoint
	if cfg.BaseURL != nil && *cfg.BaseURL != "" {
		url = *cfg.BaseURL
	}
	
	reqBody := map[string]interface{}{
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
	req.Header.Set("api-key", cfg.APIKey) // Azure uses api-key header

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("azure API error: %s", string(respBytes))
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

	return "", errors.New("empty response from Azure OpenAI")
}

func (s *AIService) callOllama(cfg *models.AIConfiguration, prompt string) (string, error) {
	baseURL := "http://localhost:11434"
	if cfg.BaseURL != nil && *cfg.BaseURL != "" {
		baseURL = *cfg.BaseURL
	}
	url := fmt.Sprintf("%s/api/generate", baseURL)
	
	reqBody := map[string]interface{}{
		"model": cfg.ModelName,
		"prompt": prompt,
		"stream": false,
	}
	
	bodyBytes, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("ollama API error: %s", string(respBytes))
	}

	var resData map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&resData); err != nil {
		return "", err
	}

	if responseTxt, ok := resData["response"].(string); ok {
		return responseTxt, nil
	}

	return "", errors.New("empty response from Ollama")
}

// GetAvailableModels queries the provider's API for available models
func (s *AIService) GetAvailableModels(provider, apiKey, baseUrl string) ([]string, error) {
	switch provider {
	case "gemini":
		url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models?key=%s", apiKey)
		resp, err := http.Get(url)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			respBytes, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("gemini API error: %s", string(respBytes))
		}

		var resData struct {
			Models []struct {
				Name string `json:"name"`
				SupportedGenerationMethods []string `json:"supportedGenerationMethods"`
			} `json:"models"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&resData); err != nil {
			return nil, err
		}

		var modelsList []string
		for _, m := range resData.Models {
			// Check if model supports generateContent
			supportsGenerate := false
			for _, method := range m.SupportedGenerationMethods {
				if method == "generateContent" {
					supportsGenerate = true
					break
				}
			}
			if !supportsGenerate {
				continue
			}

			// e.g., "models/gemini-1.5-flash" -> "gemini-1.5-flash"
			name := m.Name
			if len(name) > 7 && name[:7] == "models/" {
				name = name[7:]
			}
			modelsList = append(modelsList, name)
		}
		return modelsList, nil

	case "openai":
		url := "https://api.openai.com/v1/models"
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+apiKey)
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			respBytes, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("openai API error: %s", string(respBytes))
		}

		var resData struct {
			Data []struct {
				ID string `json:"id"`
			} `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&resData); err != nil {
			return nil, err
		}

		var modelsList []string
		for _, m := range resData.Data {
			modelsList = append(modelsList, m.ID)
		}
		return modelsList, nil

	case "ollama":
		u := "http://localhost:11434"
		if baseUrl != "" {
			u = baseUrl
		}
		url := fmt.Sprintf("%s/api/tags", u)
		resp, err := http.Get(url)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			respBytes, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("ollama API error: %s", string(respBytes))
		}

		var resData struct {
			Models []struct {
				Name string `json:"name"`
			} `json:"models"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&resData); err != nil {
			return nil, err
		}

		var modelsList []string
		for _, m := range resData.Models {
			modelsList = append(modelsList, m.Name)
		}
		return modelsList, nil

	case "anthropic":
		// Anthropic does not have a public list models endpoint.
		// Return a predefined list.
		return []string{
			"claude-3-5-sonnet-20240620",
			"claude-3-opus-20240229",
			"claude-3-haiku-20240307",
		}, nil

	case "azure":
		// Azure models depend on deployment, returning empty to indicate free text.
		return []string{}, nil
	}

	return nil, fmt.Errorf("unsupported AI provider: %s", provider)
}

