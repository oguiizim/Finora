package recurring

import (
	"errors"
	"strings"
	"time"
)

type Service struct{ repository *Repository }

func InitService(r *Repository) *Service { return &Service{r} }
func validate(e Expense) error {
	if strings.TrimSpace(e.Name) == "" {
		return errors.New("name is required")
	}
	if e.Amount < 1 {
		return errors.New("amount must be greater than zero")
	}
	if !e.Frequency.IsValid() {
		return errors.New("invalid frequency")
	}
	if !e.Status.IsValid() {
		return errors.New("invalid status")
	}
	if e.StartDate.IsZero() {
		return errors.New("start_date is required")
	}
	if e.EndDate != nil && e.EndDate.Before(e.StartDate) {
		return errors.New("end_date must be after start_date")
	}
	return nil
}
func (s *Service) Create(user int64, data UpsertExpense) (*Expense, error) {
	e := Expense{UserID: user, Name: strings.TrimSpace(data.Name), Amount: data.Amount, CategoryID: data.CategoryID, Frequency: data.Frequency, StartDate: data.StartDate, EndDate: data.EndDate, Status: data.Status}
	if e.Status == "" {
		e.Status = Active
	}
	if err := validate(e); err != nil {
		return nil, err
	}
	return s.repository.Create(e)
}
func (s *Service) List(user int64) ([]Expense, error) { return s.repository.List(user) }
func (s *Service) Update(user, id int64, data UpsertExpense) (*Expense, error) {
	e := Expense{ID: id, UserID: user, Name: strings.TrimSpace(data.Name), Amount: data.Amount, CategoryID: data.CategoryID, Frequency: data.Frequency, StartDate: data.StartDate, EndDate: data.EndDate, Status: data.Status}
	if err := validate(e); err != nil {
		return nil, err
	}
	return s.repository.Update(e)
}
func (s *Service) Delete(user, id int64) error { return s.repository.Delete(user, id) }
func (s *Service) Projection(user int64, count int, now time.Time) (*Projection, error) {
	return s.projection(user, count, now, nil)
}

// Simulate follows the exact projection rules while keeping the proposed
// commitment in memory only; no recurring expense is inserted or updated.
func (s *Service) Simulate(user int64, count int, now time.Time, data UpsertExpense) (*Projection, error) {
	fake := Expense{ID: 0, UserID: user, Name: strings.TrimSpace(data.Name), Amount: data.Amount, Frequency: data.Frequency, StartDate: data.StartDate, EndDate: data.EndDate, Status: Active}
	if err := validate(fake); err != nil {
		return nil, err
	}
	return s.projection(user, count, now, &fake)
}

func (s *Service) projection(user int64, count int, now time.Time, simulated *Expense) (*Projection, error) {
	if count < 1 {
		count = 12
	}
	if count > 36 {
		count = 36
	}
	today := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)
	// Use the last three complete months; the current partial month is excluded.
	historyStart := today.AddDate(0, -3, 0)
	// Re-read transaction values grouped by month is intentionally performed in repository query below.
	rows, err := s.repository.db.Query(`SELECT substr(date,1,7), COALESCE(SUM(amount),0) FROM transactions WHERE user_id=? AND type='INCOME' AND status='PAID' AND date>=? AND date<? GROUP BY substr(date,1,7)`, user, historyStart.Format("2006-01-02"), today.Format("2006-01-02"))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	sum := int64(0)
	used := 0
	for rows.Next() {
		var m string
		var amount int64
		if err := rows.Scan(&m, &amount); err != nil {
			return nil, err
		}
		sum += amount
		used++
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	avg := int64(0)
	if used > 0 {
		avg = sum / int64(used)
	}
	expenses, err := s.repository.List(user)
	if err != nil {
		return nil, err
	}
	active := 0
	for _, e := range expenses {
		if e.Status == Active {
			active++
		}
	}
	if simulated != nil {
		expenses = append(expenses, *simulated)
	}
	p := &Projection{MonthlyIncomeAverage: avg, HistoricalAverage: avg, MonthsUsed: used, HasIncomeHistory: used > 0, HasExpenseHistory: used > 0, ActiveRecurringCount: active, Months: make([]ProjectionMonth, 0, count)}
	for i := 1; i <= count; i++ {
		month := today.AddDate(0, i, 0)
		next := month.AddDate(0, 1, 0)
		occ := []Occurrence{}
		total := int64(0)
		for _, e := range expenses {
			if e.Status != Active {
				continue
			}
			for _, d := range occurrences(e, month, next) {
				occ = append(occ, Occurrence{e.ID, e.Name, e.Amount, d.Format("2006-01-02")})
				total += e.Amount
			}
		}
		p.Months = append(p.Months, ProjectionMonth{Month: month.Format("2006-01"), MonthlyIncomeAverage: avg, HistoricalAverage: avg, RecurringTotal: total, RemainingAfterRecurring: avg - total, Occurrences: occ})
	}
	return p, nil
}
func occurrences(e Expense, from, to time.Time) []time.Time {
	out := []time.Time{}
	for index := 0; ; index++ {
		d := occurrenceAt(e.StartDate, e.Frequency, index)
		if !d.Before(to) {
			break
		}
		if e.EndDate != nil && d.After(*e.EndDate) {
			break
		}
		if !d.Before(from) {
			out = append(out, d)
		}
	}
	return out
}

func occurrenceAt(start time.Time, frequency Frequency, index int) time.Time {
	switch frequency {
	case Weekly:
		return start.AddDate(0, 0, 7*index)
	case Monthly:
		return addMonthsClamped(start, index)
	case Quarterly:
		return addMonthsClamped(start, 3*index)
	case Semiannual:
		return addMonthsClamped(start, 6*index)
	default:
		return addMonthsClamped(start, 12*index)
	}
}
func next(d time.Time, f Frequency) time.Time {
	switch f {
	case Weekly:
		return d.AddDate(0, 0, 7)
	case Monthly:
		return addMonthsClamped(d, 1)
	case Quarterly:
		return addMonthsClamped(d, 3)
	case Semiannual:
		return addMonthsClamped(d, 6)
	default:
		return addMonthsClamped(d, 12)
	}
}

func addMonthsClamped(date time.Time, months int) time.Time {
	target := time.Date(date.Year(), date.Month()+time.Month(months), 1, date.Hour(), date.Minute(), date.Second(), date.Nanosecond(), date.Location())
	lastDay := target.AddDate(0, 1, -1).Day()
	day := date.Day()
	if day > lastDay {
		day = lastDay
	}
	return time.Date(target.Year(), target.Month(), day, date.Hour(), date.Minute(), date.Second(), date.Nanosecond(), date.Location())
}
