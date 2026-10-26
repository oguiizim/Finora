package category

import (
	"errors"
	"strings"
	"time"
)

type Service struct{ repository *Repository }

func InitService(repository *Repository) *Service { return &Service{repository: repository} }
func (s *Service) Create(userID int64, category CreateCategory) error {
	category.Name = strings.Trim(strings.TrimSpace(category.Name), `"`)
	if category.Name == "" {
		return errors.New("name cannot be empty")
	}
	return s.repository.Create(Category{UserID: userID, Name: category.Name, CreatedAt: time.Now()})
}
func (s *Service) Edit(userID int64, category EditCategory) (*Category, error) {
	if strings.TrimSpace(category.Name) == "" {
		return nil, errors.New("name cannot be empty")
	}
	return s.repository.Edit(Category{ID: category.ID, UserID: userID, Name: category.Name})
}
func (s *Service) GetAll(userID int64) (*[]Category, error) { return s.repository.GetAll(userID) }
func (s *Service) GetById(userID, id int64) (*Category, error) {
	return s.repository.GetById(userID, id)
}
func (s *Service) Delete(userID, id int64) error { return s.repository.Delete(userID, id) }
