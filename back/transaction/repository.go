package transaction

import (
	"database/sql"
	"errors"
	"time"
)

type Repository struct {
	db *sql.DB
}

func InitRepository(d *sql.DB) *Repository {
	return &Repository{
		db: d,
	}
}

func (r *Repository) Create(transaction Transaction) (*Transaction, error) {
	result, err := r.db.Exec(`
	INSERT INTO transactions (type, name, category_id, amount, date, status)
	VALUES (?, ?, ?, ?, ?, ?)
	`,
		transaction.Type,
		transaction.Name,
		transaction.CategoryID,
		transaction.Amount,
		transaction.Date.Format("2006-01-02"),
		transaction.Status)
	if err != nil {
		return nil, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	return r.GetByID(id)
}

const transactionSelect = `SELECT t.id, t.type, t.name, t.category_id, t.amount, t.date, t.status, t.created_at, t.updated_at, c.name
FROM transactions t JOIN categories c ON c.id = t.category_id`

func scanTransaction(row interface{ Scan(...any) error }) (*Transaction, error) {
	var item Transaction
	var date, created, updated string
	err := row.Scan(&item.ID, &item.Type, &item.Name, &item.CategoryID, &item.Amount, &date, &item.Status, &created, &updated, &item.CategoryName)
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

func (r *Repository) GetAll() ([]Transaction, error) {
	rows, err := r.db.Query(transactionSelect + " ORDER BY t.date DESC, t.id DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	transactions := make([]Transaction, 0)
	for rows.Next() {
		item, err := scanTransaction(rows)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, *item)
	}
	return transactions, rows.Err()
}

func (r *Repository) GetByID(id int64) (*Transaction, error) {
	item, err := scanTransaction(r.db.QueryRow(transactionSelect+" WHERE t.id = ?", id))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("transaction not found")
	}
	return item, err
}

func (r *Repository) Update(transaction Transaction) (*Transaction, error) {
	result, err := r.db.Exec(`UPDATE transactions SET type = ?, name = ?, category_id = ?, amount = ?, date = ?, status = ?, updated_at = ? WHERE id = ?`, transaction.Type, transaction.Name, transaction.CategoryID, transaction.Amount, transaction.Date.Format("2006-01-02"), transaction.Status, transaction.UpdatedAt.Format("2006-01-02 15:04:05"), transaction.ID)
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
	return r.GetByID(transaction.ID)
}

func (r *Repository) Delete(id int64) error {
	result, err := r.db.Exec("DELETE FROM transactions WHERE id = ?", id)
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

func (r *Repository) Summary() (*Summary, error) {
	var summary Summary
	err := r.db.QueryRow(`SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' AND status = 'PAID' THEN amount ELSE 0 END), 0), COALESCE(SUM(CASE WHEN type = 'EXPENSE' AND status = 'PAID' THEN amount ELSE 0 END), 0) FROM transactions`).Scan(&summary.Income, &summary.Expense)
	if err != nil {
		return nil, err
	}
	summary.Balance = summary.Income - summary.Expense
	return &summary, nil
}
