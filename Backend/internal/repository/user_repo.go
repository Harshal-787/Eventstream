package repository

import (
	"database/sql"
	"errors"

	"eventstream/internal/models"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	user := &models.User{}
	query := `SELECT id, name, email, password_hash, role, status, contact_number, driving_license, otp_code, otp_expires_at, reset_token, reset_token_expires_at, created_at FROM users WHERE email = $1 LIMIT 1`
	err := r.db.QueryRow(query, email).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.Status, &user.ContactNumber, &user.DrivingLicense, &user.OTPCode, &user.OTPExpiresAt, &user.ResetToken, &user.ResetTokenExpiresAt, &user.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) FindByID(id int) (*models.User, error) {
	user := &models.User{}
	query := `SELECT id, name, email, password_hash, role, status, contact_number, driving_license, otp_code, otp_expires_at, reset_token, reset_token_expires_at, created_at FROM users WHERE id = $1 LIMIT 1`
	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.Status, &user.ContactNumber, &user.DrivingLicense, &user.OTPCode, &user.OTPExpiresAt, &user.ResetToken, &user.ResetTokenExpiresAt, &user.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) CreateUser(name, email, passwordHash, status, contactNumber, drivingLicense string) (*models.User, error) {
	user := &models.User{}
	query := `INSERT INTO users (name, email, password_hash, role, status, contact_number, driving_license) VALUES ($1, $2, $3, 'user', $4, $5, $6) RETURNING id, name, email, role, status, contact_number, driving_license, created_at`
	
	// Convert empty strings to null for optional fields
	var cNumber, dLicense interface{}
	if contactNumber != "" { cNumber = contactNumber }
	if drivingLicense != "" { dLicense = drivingLicense }
	
	err := r.db.QueryRow(query, name, email, passwordHash, status, cNumber, dLicense).Scan(
		&user.ID, &user.Name, &user.Email, &user.Role, &user.Status, &user.ContactNumber, &user.DrivingLicense, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) ListUsers() ([]*models.User, error) {
	query := `SELECT id, name, email, role, status, contact_number, driving_license, created_at FROM users`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.Status, &user.ContactNumber, &user.DrivingLicense, &user.CreatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}

func (r *UserRepository) UpdateUserStatus(id int, status string) error {
	query := `UPDATE users SET status = $1 WHERE id = $2`
	_, err := r.db.Exec(query, status, id)
	return err
}

func (r *UserRepository) UpdateUserInfo(id int, name, status string) error {
	query := `UPDATE users SET name = $1, status = $2 WHERE id = $3`
	_, err := r.db.Exec(query, name, status, id)
	return err
}

func (r *UserRepository) UpdateUserName(id int, name string) error {
	query := `UPDATE users SET name = $1 WHERE id = $2`
	_, err := r.db.Exec(query, name, id)
	return err
}

func (r *UserRepository) DeleteUser(id int) error {
	// Cascade delete buildings owned by the user
	queryBuildings := `DELETE FROM buildings WHERE owner_id = $1`
	_, err := r.db.Exec(queryBuildings, id)
	if err != nil {
		return err
	}

	query := `DELETE FROM users WHERE id = $1`
	_, err = r.db.Exec(query, id)
	return err
}

func (r *UserRepository) SaveOTP(id int, code string, expiresAt string) error {
	query := `UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3`
	_, err := r.db.Exec(query, code, expiresAt, id)
	return err
}

func (r *UserRepository) ClearOTP(id int) error {
	query := `UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *UserRepository) SaveResetToken(email string, token string, expiresAt string) error {
	query := `UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE email = $3`
	_, err := r.db.Exec(query, token, expiresAt, email)
	return err
}

func (r *UserRepository) FindByResetToken(token string) (*models.User, error) {
	user := &models.User{}
	query := `SELECT id, name, email, password_hash, role, status, contact_number, driving_license, otp_code, otp_expires_at, reset_token, reset_token_expires_at, created_at FROM users WHERE reset_token = $1 LIMIT 1`
	err := r.db.QueryRow(query, token).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.Status, &user.ContactNumber, &user.DrivingLicense, &user.OTPCode, &user.OTPExpiresAt, &user.ResetToken, &user.ResetTokenExpiresAt, &user.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) UpdatePassword(id int, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2`
	_, err := r.db.Exec(query, passwordHash, id)
	return err
}

