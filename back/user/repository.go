package user

import (
	"database/sql"
	"errors"
)

var ErrNotFound = errors.New("user not found")

type Repository struct{ db *sql.DB }

func InitRepository(db *sql.DB) *Repository { return &Repository{db: db} }

func (r *Repository) Create(name, password string) (*User, error) {
	result, err := r.db.Exec(`INSERT INTO users (nome, senha, ativo) VALUES (?, ?, true)`, name, password)
	if err != nil {
		return nil, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	return r.ByID(id)
}
func (r *Repository) ByName(name string) (*User, error) {
	var u User
	err := r.db.QueryRow(`SELECT id, nome, senha, ativo FROM users WHERE nome = ?`, name).Scan(&u.ID, &u.Name, &u.Password, &u.Active)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &u, err
}
func (r *Repository) ByID(id int64) (*User, error) {
	var u User
	err := r.db.QueryRow(`SELECT id, nome, senha, ativo FROM users WHERE id = ?`, id).Scan(&u.ID, &u.Name, &u.Password, &u.Active)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &u, err
}
func (r *Repository) ByRefreshToken(tokenHash string) (*User, error) {
	var u User
	err := r.db.QueryRow(`SELECT id, nome, senha, ativo FROM users WHERE refresh_token = ?`, tokenHash).Scan(&u.ID, &u.Name, &u.Password, &u.Active)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &u, err
}
func (r *Repository) SaveRefreshToken(id int64, tokenHash string) error {
	_, err := r.db.Exec(`UPDATE users SET refresh_token = ? WHERE id = ?`, tokenHash, id)
	return err
}
