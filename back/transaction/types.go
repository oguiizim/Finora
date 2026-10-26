package transaction

import "time"

type TransactionType string
type TransactionStatus string

const (
	Pending   TransactionStatus = "PENDING"
	Paid      TransactionStatus = "PAID"
	Cancelled TransactionStatus = "CANCELLED"
)

const (
	Income  TransactionType = "INCOME"
	Expense TransactionType = "EXPENSE"
)

type Transaction struct {
	ID           int64             `json:"id"`
	UserID       int64             `json:"-"`
	Type         TransactionType   `json:"type"`
	Name         string            `json:"name"`
	CategoryID   int64             `json:"category_id"`
	Amount       int64             `json:"amount"`
	Date         time.Time         `json:"date"`
	Status       TransactionStatus `json:"status"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
	CategoryName string            `json:"category_name,omitempty"`
}

type CreateTransaction struct {
	Type       TransactionType   `json:"type"`
	Name       string            `json:"name"`
	CategoryID int64             `json:"category_id"`
	Amount     int64             `json:"amount"`
	Date       time.Time         `json:"date"`
	Status     TransactionStatus `json:"status"`
}

type UpdateTransaction struct {
	Type       TransactionType   `json:"type"`
	Name       string            `json:"name"`
	CategoryID int64             `json:"category_id"`
	Amount     int64             `json:"amount"`
	Date       time.Time         `json:"date"`
	Status     TransactionStatus `json:"status"`
}

type Summary struct {
	Income  int64 `json:"income"`
	Expense int64 `json:"expense"`
	Balance int64 `json:"balance"`
}

func (t TransactionType) IsValid() bool {
	switch t {
	case Income, Expense:
		return true
	default:
		return false
	}
}

func (s TransactionStatus) IsValid() bool {
	switch s {
	case Pending, Paid, Cancelled:
		return true
	default:
		return false
	}
}
