package recurring

import (
	"database/sql"
	"errors"
	"time"
)

type Repository struct{ db *sql.DB }

func InitRepository(db *sql.DB) *Repository { return &Repository{db} }

func scan(row interface{ Scan(...any) error }) (*Expense, error) {
	var e Expense
	var start, end sql.NullString
	var created, updated string
	var category sql.NullInt64
	err := row.Scan(&e.ID, &e.UserID, &e.Name, &e.Amount, &category, &e.Frequency, &start, &end, &e.Status, &created, &updated)
	if err != nil {
		return nil, err
	}
	if category.Valid {
		e.CategoryID = &category.Int64
	}
	parse := func(s string) (time.Time, error) {
		t, err := time.ParseInLocation("2006-01-02 15:04:05", s, time.Local)
		if err != nil {
			t, err = time.ParseInLocation("2006-01-02", s, time.Local)
		}
		return t, err
	}
	if e.StartDate, err = parse(start.String); err != nil {
		return nil, err
	}
	if end.Valid {
		t, err := parse(end.String)
		if err != nil {
			return nil, err
		}
		e.EndDate = &t
	}
	if e.CreatedAt, err = parse(created); err != nil {
		return nil, err
	}
	e.UpdatedAt, err = parse(updated)
	return &e, err
}

const selectExpense = `SELECT id, user_id, name, amount, category_id, frequency, start_date, end_date, status, created_at, updated_at FROM recurring_expenses`

func (r *Repository) List(user int64) ([]Expense, error) {
	rows, err := r.db.Query(selectExpense+` WHERE user_id = ? ORDER BY amount DESC, id DESC`, user)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Expense{}
	for rows.Next() {
		e, err := scan(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *e)
	}
	return items, rows.Err()
}
func (r *Repository) Get(user, id int64) (*Expense, error) {
	e, err := scan(r.db.QueryRow(selectExpense+` WHERE id=? AND user_id=?`, id, user))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("recurring expense not found")
	}
	return e, err
}
func (r *Repository) Create(e Expense) (*Expense, error) {
	result, err := r.db.Exec(`INSERT INTO recurring_expenses(user_id,name,amount,category_id,frequency,start_date,end_date,status) VALUES(?,?,?,?,?,?,?,?)`, e.UserID, e.Name, e.Amount, e.CategoryID, e.Frequency, e.StartDate.Format("2006-01-02"), dateOrNil(e.EndDate), e.Status)
	if err != nil {
		return nil, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	return r.Get(e.UserID, id)
}
func (r *Repository) Update(e Expense) (*Expense, error) {
	result, err := r.db.Exec(`UPDATE recurring_expenses SET name=?,amount=?,category_id=?,frequency=?,start_date=?,end_date=?,status=?,updated_at=? WHERE id=? AND user_id=?`, e.Name, e.Amount, e.CategoryID, e.Frequency, e.StartDate.Format("2006-01-02"), dateOrNil(e.EndDate), e.Status, time.Now().Format("2006-01-02 15:04:05"), e.ID, e.UserID)
	if err != nil {
		return nil, err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if n == 0 {
		return nil, errors.New("recurring expense not found")
	}
	return r.Get(e.UserID, e.ID)
}
func (r *Repository) Delete(user, id int64) error {
	result, err := r.db.Exec(`DELETE FROM recurring_expenses WHERE id=? AND user_id=?`, id, user)
	if err != nil {
		return err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return errors.New("recurring expense not found")
	}
	return nil
}
func dateOrNil(t *time.Time) any {
	if t == nil {
		return nil
	}
	return t.Format("2006-01-02")
}
func (r *Repository) MonthlyExpenses(user int64, from, to time.Time) ([]int64, error) {
	rows, err := r.db.Query(`SELECT amount FROM transactions WHERE user_id=? AND type='EXPENSE' AND status='PAID' AND date >= ? AND date < ?`, user, from.Format("2006-01-02"), to.Format("2006-01-02"))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var amounts []int64
	for rows.Next() {
		var a int64
		if err := rows.Scan(&a); err != nil {
			return nil, err
		}
		amounts = append(amounts, a)
	}
	return amounts, rows.Err()
}
