package category

import (
	"database/sql"
	"errors"
	"time"
)

type Repository struct {
	db *sql.DB
}

func InitRepository(database *sql.DB) *Repository {
	return &Repository{
		db: database,
	}
}

func (r *Repository) Create(category Category) error {
	_, err := r.db.Exec(`
	INSERT INTO categories (name, created_at)
	VALUES(?, ?)`,
		category.Name,
		category.CreatedAt.Format("2006-01-02 15:04:05"))
	if err != nil {
		return err
	}
	return err
}

func (r *Repository) Edit(category Category) (*Category, error) {
	var data Category
	_, err := r.db.Exec(`
	UPDATE categories 
	SET name = ?
	WHERE id = ?`, category.Name, category.ID)
	if err != nil {
		return nil, err
	}
	r.db.QueryRow(`
	SELECT id, name, created_at
	FROM categories
	WHERE id = ?`, category.ID).Scan(&data.ID, &data.Name, &data.CreatedAt)
	return &data, nil
}

func (r *Repository) GetAll() (*[]Category, error) {
	rows, err := r.db.Query(`SELECT id, name, created_at FROM categories`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	categories := []Category{}

	for rows.Next() {
		var c Category
		var created string
		err := rows.Scan(&c.ID, &c.Name, &created)
		if err != nil {
			return nil, err
		}
		c.CreatedAt, err = time.Parse("2006-01-02 15:04:05", created)
		if err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return &categories, nil
}

func (r *Repository) GetById(id int64) (*Category, error) {
	var data Category
	result := r.db.QueryRow(`
	SELECT id, name, created_at FROM categories
	WHERE id = ?`, id).Scan(&data.ID, &data.Name, &data.CreatedAt)
	if result.Error() == sql.ErrNoRows.Error() {
		return nil, errors.New("Category not found")
	}
	return &data, nil
}
