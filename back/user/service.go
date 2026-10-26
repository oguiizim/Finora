package user

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"strings"

	"github.com/oguiizim/finora/auth"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid credentials")

type Service struct {
	repository *Repository
	tokens     *auth.TokenManager
}

func InitService(r *Repository, tokens *auth.TokenManager) *Service {
	return &Service{repository: r, tokens: tokens}
}

func (s *Service) Register(req RegisterRequest) (*Session, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" || len(name) > 100 {
		return nil, errors.New("name must contain between 1 and 100 characters")
	}
	if len(req.Password) < 8 {
		return nil, errors.New("password must contain at least 8 characters")
	}
	if _, err := s.repository.ByName(name); err == nil {
		return nil, errors.New("name already in use")
	} else if !errors.Is(err, ErrNotFound) {
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	u, err := s.repository.Create(name, string(hash))
	if err != nil {
		return nil, err
	}
	return s.newSession(u)
}
func (s *Service) Login(req LoginRequest) (*Session, error) {
	u, err := s.repository.ByName(strings.TrimSpace(req.Name))
	if err != nil || !u.Active || bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(req.Password)) != nil {
		return nil, ErrInvalidCredentials
	}
	return s.newSession(u)
}
func (s *Service) Refresh(token string) (*Session, error) {
	if token == "" {
		return nil, ErrInvalidCredentials
	}
	u, err := s.repository.ByRefreshToken(hashToken(token))
	if err != nil || !u.Active {
		return nil, ErrInvalidCredentials
	}
	return s.newSession(u)
}
func (s *Service) Logout(userID int64) error      { return s.repository.SaveRefreshToken(userID, "") }
func (s *Service) Me(userID int64) (*User, error) { return s.repository.ByID(userID) }
func (s *Service) newSession(u *User) (*Session, error) {
	access, err := s.tokens.NewAccessToken(u.ID)
	if err != nil {
		return nil, err
	}
	refresh, err := newRefreshToken()
	if err != nil {
		return nil, err
	}
	if err := s.repository.SaveRefreshToken(u.ID, hashToken(refresh)); err != nil {
		return nil, err
	}
	return &Session{User: *u, AccessToken: access, RefreshToken: refresh}, nil
}
func newRefreshToken() (string, error) {
	data := make([]byte, 32)
	if _, err := rand.Read(data); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(data), nil
}
func hashToken(token string) string {
	value := sha256.Sum256([]byte(token))
	return base64.RawURLEncoding.EncodeToString(value[:])
}
