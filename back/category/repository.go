package category

import (
	"database/sql"
	"errors"
	"time"
)

type Repository struct{ db *sql.DB }

func InitRepository(database *sql.DB) *Repository { return &Repository{db: database} }
func (r *Repository) Create(category Category) error {
	_, err := r.db.Exec(`INSERT INTO categories (name, user_id, created_at) VALUES (?, ?, ?)`, category.Name, category.UserID, category.CreatedAt.Format("2006-01-02 15:04:05"))
	return err
}
func (r *Repository) Edit(category Category) (*Category, error) {
	result, err := r.db.Exec(`UPDATE categories SET name = ? WHERE id = ? AND user_id = ?`, category.Name, category.ID, category.UserID)
	if err != nil {
		return nil, err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if affected == 0 {
		return nil, errors.New("category not found")
	}
	return r.GetById(category.UserID, category.ID)
}
func (r *Repository) Delete(userID, id int64) error {
	var count int
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM transactions WHERE category_id = ? AND user_id = ?`, id, userID).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return errors.New("category has transactions")
	}
	result, err := r.db.Exec(`DELETE FROM categories WHERE id = ? AND user_id = ?`, id, userID)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return errors.New("category not found")
	}
	return nil
}
func (r *Repository) GetAll(userID int64) (*[]Category, error) {
	rows, err := r.db.Query(`SELECT id, user_id, name, created_at FROM categories WHERE user_id = ?`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	categories := []Category{}
	for rows.Next() {
		var item Category
		var created string
		if err := rows.Scan(&item.ID, &item.UserID, &item.Name, &created); err != nil {
			return nil, err
		}
		parsed, err := time.Parse("2006-01-02 15:04:05", created)
		if err != nil {
			return nil, err
		}
		item.CreatedAt = parsed
		categories = append(categories, item)
	}
	return &categories, rows.Err()
}
func (r *Repository) GetById(userID, id int64) (*Category, error) {
	var item Category
	var created string
	err := r.db.QueryRow(`SELECT id, user_id, name, created_at FROM categories WHERE id = ? AND user_id = ?`, id, userID).Scan(&item.ID, &item.UserID, &item.Name, &created)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("category not found")
	}
	if err != nil {
		return nil, err
	}
	parsed, err := time.Parse("2006-01-02 15:04:05", created)
	if err != nil {
		return nil, err
	}
	item.CreatedAt = parsed
	return &item, nil
}
