package repository

import (
	"database/sql"
	"log"

	"eventstream/internal/models"
)

type FailedEventRepository struct {
	db *sql.DB
}

func NewFailedEventRepository(db *sql.DB) *FailedEventRepository {
	return &FailedEventRepository{db: db}
}

func (r *FailedEventRepository) LogFailedEvent(payload []byte, errorReason, sourceIP string) {
	_, err := r.db.Exec(`
		INSERT INTO failed_events (payload, error_reason, source_ip)
		VALUES ($1, $2, $3)
	`, payload, errorReason, sourceIP)
	if err != nil {
		log.Printf("Failed to log failed event: %v", err)
	}
}

func (r *FailedEventRepository) GetFailedEvents(limit, offset int) ([]models.FailedEvent, int, error) {
	query := `SELECT id, payload, error_reason, source_ip, created_at FROM failed_events ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var events []models.FailedEvent
	for rows.Next() {
		var e models.FailedEvent
		if err := rows.Scan(&e.ID, &e.Payload, &e.ErrorReason, &e.SourceIP, &e.CreatedAt); err != nil {
			return nil, 0, err
		}
		events = append(events, e)
	}

	var total int
	err = r.db.QueryRow(`SELECT COUNT(*) FROM failed_events`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	return events, total, nil
}
