package repository

import (
	"database/sql"
	"errors"
	"eventstream/internal/models"
	"time"
)

type SessionRepository struct {
	db *sql.DB
}

func NewSessionRepository(db *sql.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) CreateSession(userID int, deviceInfo, ipAddress string) (*models.Session, error) {
	session := &models.Session{}
	query := `INSERT INTO sessions (user_id, device_info, ip_address, is_active) VALUES ($1, $2, $3, true) RETURNING id, user_id, device_info, ip_address, is_active, last_active_at, created_at`
	
	err := r.db.QueryRow(query, userID, deviceInfo, ipAddress).Scan(
		&session.ID, &session.UserID, &session.DeviceInfo, &session.IPAddress, &session.IsActive, &session.LastActiveAt, &session.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return session, nil
}

func (r *SessionRepository) GetSession(id string) (*models.Session, error) {
	session := &models.Session{}
	query := `SELECT id, user_id, device_info, ip_address, is_active, last_active_at, created_at FROM sessions WHERE id = $1 LIMIT 1`
	err := r.db.QueryRow(query, id).Scan(
		&session.ID, &session.UserID, &session.DeviceInfo, &session.IPAddress, &session.IsActive, &session.LastActiveAt, &session.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return session, nil
}

func (r *SessionRepository) RevokeSession(id string) error {
	query := `UPDATE sessions SET is_active = false WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *SessionRepository) RevokeAllOtherSessions(userID int, exceptSessionID string) error {
	query := `UPDATE sessions SET is_active = false WHERE user_id = $1 AND id != $2`
	_, err := r.db.Exec(query, userID, exceptSessionID)
	return err
}

func (r *SessionRepository) UpdateLastActive(id string) error {
	query := `UPDATE sessions SET last_active_at = $1 WHERE id = $2`
	_, err := r.db.Exec(query, time.Now(), id)
	return err
}

func (r *SessionRepository) ListActiveSessions(userID int) ([]*models.Session, error) {
	query := `SELECT id, user_id, device_info, ip_address, is_active, last_active_at, created_at FROM sessions WHERE user_id = $1 AND is_active = true ORDER BY last_active_at DESC`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*models.Session
	for rows.Next() {
		s := &models.Session{}
		if err := rows.Scan(&s.ID, &s.UserID, &s.DeviceInfo, &s.IPAddress, &s.IsActive, &s.LastActiveAt, &s.CreatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}
