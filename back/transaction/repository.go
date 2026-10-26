package transaction

import (
	"database/sql"
	"errors"
	"time"
)

type Repository struct{ db *sql.DB }

func InitRepository(d *sql.DB) *Repository { return &Repository{db: d} }
func (r *Repository) Create(item Transaction) (*Transaction, error) {
	result, err := r.db.Exec(`INSERT INTO transactions (type, name, category_id, user_id, amount, date, status) SELECT ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM categories WHERE id = ? AND user_id = ?)`, item.Type, item.Name, item.CategoryID, item.UserID, item.Amount, item.Date.Format("2006-01-02"), item.Status, item.CategoryID, item.UserID)
	if err != nil {
		return nil, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	if id == 0 {
		return nil, errors.New("a valid category is required")
	}
	return r.GetByID(item.UserID, id)
}

const transactionSelect = `SELECT t.id, t.user_id, t.type, t.name, t.category_id, t.amount, t.date, t.status, t.created_at, t.updated_at, c.name FROM transactions t JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id`

func scanTransaction(row interface{ Scan(...any) error }) (*Transaction, error) {
	var item Transaction
	var date, created, updated string
	err := row.Scan(&item.ID, &item.UserID, &item.Type, &item.Name, &item.CategoryID, &item.Amount, &date, &item.Status, &created, &updated, &item.CategoryName)
	if err != nil {
		return nil, err
	}
	for _, value := range []struct {
		raw    string
		target *time.Time
	}{{date, &item.Date}, {created, &item.CreatedAt}, {updated, &item.UpdatedAt}} {
		parsed, parseErr := time.ParseInLocation("2006-01-02 15:04:05", value.raw, time.Local)
		if parseErr != nil {
			parsed, parseErr = time.Parse("2006-01-02", value.raw)
		}
		if parseErr != nil {
			return nil, parseErr
		}
		*value.target = parsed
	}
	return &item, nil
}
func (r *Repository) GetAll(userID int64) ([]Transaction, error) {
	rows, err := r.db.Query(transactionSelect+` WHERE t.user_id = ? ORDER BY t.date DESC, t.id DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Transaction, 0)
	for rows.Next() {
		item, err := scanTransaction(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	return items, rows.Err()
}
func (r *Repository) GetByID(userID, id int64) (*Transaction, error) {
	item, err := scanTransaction(r.db.QueryRow(transactionSelect+` WHERE t.id = ? AND t.user_id = ?`, id, userID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("transaction not found")
	}
	return item, err
}
func (r *Repository) Update(item Transaction) (*Transaction, error) {
	result, err := r.db.Exec(`UPDATE transactions SET type = ?, name = ?, category_id = ?, amount = ?, date = ?, status = ?, updated_at = ? WHERE id = ? AND user_id = ? AND EXISTS (SELECT 1 FROM categories WHERE id = ? AND user_id = ?)`, item.Type, item.Name, item.CategoryID, item.Amount, item.Date.Format("2006-01-02"), item.Status, item.UpdatedAt.Format("2006-01-02 15:04:05"), item.ID, item.UserID, item.CategoryID, item.UserID)
	if err != nil {
		return nil, err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if affected == 0 {
		return nil, errors.New("transaction not found")
	}
	return r.GetByID(item.UserID, item.ID)
}
func (r *Repository) Delete(userID, id int64) error {
	result, err := r.db.Exec(`DELETE FROM transactions WHERE id = ? AND user_id = ?`, id, userID)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return errors.New("transaction not found")
	}
	return nil
}
func (r *Repository) Summary(userID int64) (*Summary, error) {
	var summary Summary
	err := r.db.QueryRow(`SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' AND status = 'PAID' THEN amount ELSE 0 END), 0), COALESCE(SUM(CASE WHEN type = 'EXPENSE' AND status = 'PAID' THEN amount ELSE 0 END), 0) FROM transactions WHERE user_id = ?`, userID).Scan(&summary.Income, &summary.Expense)
	if err != nil {
		return nil, err
	}
	summary.Balance = summary.Income - summary.Expense
	return &summary, nil
}
