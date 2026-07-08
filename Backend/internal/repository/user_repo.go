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
	query := `SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1 LIMIT 1`
	err := r.db.QueryRow(query, email).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt,
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
	query := `SELECT id, name, email, password_hash, role, created_at FROM users WHERE id = $1 LIMIT 1`
	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) CreateUser(name, email, passwordHash string) (*models.User, error) {
	user := &models.User{}
	query := `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'user') RETURNING id, name, email, role, created_at`
	err := r.db.QueryRow(query, name, email, passwordHash).Scan(
		&user.ID, &user.Name, &user.Email, &user.Role, &user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}
