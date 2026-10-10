package category

import (
	"errors"
	"strings"
	"time"
)

type Service struct {
	repository *Repository
}

func InitService(repository *Repository) *Service {
	return &Service{
		repository: repository,
	}
}

func (s *Service) Create(category CreateCategory) error {
	category.Name = strings.TrimSpace(category.Name)
	category.Name = strings.Trim(category.Name, `"`)
	if category.Name == "" {
		return errors.New("Name cannot be empty")
	}

	err := s.repository.Create(Category{
		Name:      category.Name,
		CreatedAt: time.Now(),
	})
	if err != nil {
		return err
	}
	return nil
}

func (s *Service) Edit(category EditCategory) (*Category, error) {
	if strings.TrimSpace(category.Name) == "" {
		return nil, errors.New("Name cannot be empty")
	}
	data, err := s.repository.Edit(Category{
		ID:   category.ID,
		Name: category.Name,
	})
	if err != nil {
		return nil, err
	}
	return data, nil
}

func (s *Service) GetAll() (*[]Category, error) {
	categories, err := s.repository.GetAll()
	if err != nil {
		return nil, err
	}
	return categories, nil
}

func (s *Service) GetById(id int64) (*Category, error) {
	category, err := s.repository.GetById(id)
	if err != nil {
		return nil, err
	}
	return category, nil
}