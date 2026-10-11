package transaction

import (
	"errors"
	"strings"
	"time"
)

type Service struct {
	repository *Repository
}

func InitService(r *Repository) *Service {
	return &Service{
		repository: r,
	}
}

func validate(data Transaction) error {
	if !data.Type.IsValid() || !data.Status.IsValid() {
		return errors.New("invalid transaction type or status")
	}
	if strings.TrimSpace(data.Name) == "" {
		return errors.New("transaction name cannot be empty")
	}
	if data.CategoryID < 1 {
		return errors.New("a valid category is required")
	}
	if data.Amount < 1 {
		return errors.New("amount must be greater than zero")
	}
	if data.Date.IsZero() {
		return errors.New("transaction date is required")
	}
	return nil
}

func (s *Service) Create(data CreateTransaction) (*Transaction, error) {
	entry := Transaction{
		Type:       data.Type,
		Name:       strings.TrimSpace(data.Name),
		CategoryID: data.CategoryID,
		Amount:     data.Amount,
		Date:       data.Date,
		Status:     data.Status,
	}
	if err := validate(entry); err != nil {
		return nil, err
	}
	return s.repository.Create(entry)
}

func (s *Service) GetAll() ([]Transaction, error) { return s.repository.GetAll() }

func (s *Service) GetByID(id int64) (*Transaction, error) { return s.repository.GetByID(id) }

func (s *Service) Update(id int64, data UpdateTransaction) (*Transaction, error) {
	entry := Transaction{ID: id, Type: data.Type, Name: strings.TrimSpace(data.Name), CategoryID: data.CategoryID, Amount: data.Amount, Date: data.Date, Status: data.Status, UpdatedAt: time.Now()}
	if err := validate(entry); err != nil {
		return nil, err
	}
	return s.repository.Update(entry)
}

func (s *Service) Delete(id int64) error { return s.repository.Delete(id) }

func (s *Service) Summary() (*Summary, error) { return s.repository.Summary() }
