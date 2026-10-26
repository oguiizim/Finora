package transaction

import (
	"errors"
	"strings"
	"time"
)

type Service struct{ repository *Repository }

func InitService(r *Repository) *Service { return &Service{repository: r} }
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
func (s *Service) Create(userID int64, data CreateTransaction) (*Transaction, error) {
	entry := Transaction{UserID: userID, Type: data.Type, Name: strings.TrimSpace(data.Name), CategoryID: data.CategoryID, Amount: data.Amount, Date: data.Date, Status: data.Status}
	if err := validate(entry); err != nil {
		return nil, err
	}
	return s.repository.Create(entry)
}
func (s *Service) GetAll(userID int64) ([]Transaction, error) { return s.repository.GetAll(userID) }
func (s *Service) GetByID(userID, id int64) (*Transaction, error) {
	return s.repository.GetByID(userID, id)
}
func (s *Service) Update(userID, id int64, data UpdateTransaction) (*Transaction, error) {
	entry := Transaction{ID: id, UserID: userID, Type: data.Type, Name: strings.TrimSpace(data.Name), CategoryID: data.CategoryID, Amount: data.Amount, Date: data.Date, Status: data.Status, UpdatedAt: time.Now()}
	if err := validate(entry); err != nil {
		return nil, err
	}
	return s.repository.Update(entry)
}
func (s *Service) Delete(userID, id int64) error          { return s.repository.Delete(userID, id) }
func (s *Service) Summary(userID int64) (*Summary, error) { return s.repository.Summary(userID) }
