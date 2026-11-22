package recurring

import "time"

type Frequency string
type Status string

const (
	Weekly     Frequency = "WEEKLY"
	Monthly    Frequency = "MONTHLY"
	Quarterly  Frequency = "QUARTERLY"
	Semiannual Frequency = "SEMIANNUAL"
	Yearly     Frequency = "YEARLY"
	Active     Status    = "ACTIVE"
	Inactive   Status    = "INACTIVE"
)

type Expense struct {
	ID         int64      `json:"id"`
	UserID     int64      `json:"-"`
	Name       string     `json:"name"`
	Amount     int64      `json:"amount"`
	CategoryID *int64     `json:"category_id,omitempty"`
	Frequency  Frequency  `json:"frequency"`
	StartDate  time.Time  `json:"start_date"`
	EndDate    *time.Time `json:"end_date,omitempty"`
	Status     Status     `json:"status"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}
type UpsertExpense struct {
	Name       string     `json:"name"`
	Amount     int64      `json:"amount"`
	CategoryID *int64     `json:"category_id"`
	Frequency  Frequency  `json:"frequency"`
	StartDate  time.Time  `json:"start_date"`
	EndDate    *time.Time `json:"end_date"`
	Status     Status     `json:"status"`
}
type Occurrence struct {
	ID     int64  `json:"id"`
	Name   string `json:"name"`
	Amount int64  `json:"amount"`
	Date   string `json:"date"`
}
type ProjectionMonth struct {
	Month                   string       `json:"month"`
	MonthlyIncomeAverage    int64        `json:"monthly_income_average"`
	HistoricalAverage       int64        `json:"historical_average"` // Compatibility alias for older clients.
	RecurringTotal          int64        `json:"recurring_total"`
	RemainingAfterRecurring int64        `json:"remaining_after_recurring"`
	Occurrences             []Occurrence `json:"occurrences"`
}
type Projection struct {
	MonthlyIncomeAverage int64             `json:"monthly_income_average"`
	HistoricalAverage    int64             `json:"historical_average"` // Compatibility alias for older clients.
	MonthsUsed           int               `json:"months_used"`
	HasIncomeHistory     bool              `json:"has_income_history"`
	HasExpenseHistory    bool              `json:"has_expense_history"` // Compatibility alias for older clients.
	ActiveRecurringCount int               `json:"active_recurring_count"`
	Months               []ProjectionMonth `json:"months"`
}

func (f Frequency) IsValid() bool {
	return f == Weekly || f == Monthly || f == Quarterly || f == Semiannual || f == Yearly
}
func (s Status) IsValid() bool { return s == Active || s == Inactive }
