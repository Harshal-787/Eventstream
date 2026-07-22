package services

import (
	"log"
	"encoding/json"
	"eventstream/internal/models"
	"eventstream/internal/repository"
)

type AuditLogger struct {
	repo *repository.AuditLogRepository
}

func NewAuditLogger(repo *repository.AuditLogRepository) *AuditLogger {
	return &AuditLogger{repo: repo}
}

// Log is a non-blocking way to save an audit log
func (l *AuditLogger) Log(userID *int, action string, entityType *string, entityID *int, details interface{}, ip string) {
	go func() {
		var detailsMap map[string]interface{}
		
		if details != nil {
			if m, ok := details.(map[string]interface{}); ok {
				detailsMap = m
			} else {
				b, err := json.Marshal(details)
				if err == nil {
					json.Unmarshal(b, &detailsMap)
				}
			}
		}

		entry := &models.AuditLog{
			UserID:     userID,
			Action:     action,
			EntityType: entityType,
			EntityID:   entityID,
			Details:    detailsMap,
			IPAddress:  &ip,
		}
		if err := l.repo.Create(entry); err != nil {
			log.Printf("Failed to write audit log: %v", err)
		}
	}()
}
