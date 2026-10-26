package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

const accessTokenLifetime = 15 * time.Minute

type Claims struct {
	UserID  int64  `json:"sub"`
	Type    string `json:"typ"`
	Expires int64  `json:"exp"`
}

type TokenManager struct{ secret []byte }

func NewTokenManager(secret string) (*TokenManager, error) {
	if len(secret) < 32 {
		return nil, errors.New("JWT_SECRET must have at least 32 characters")
	}
	return &TokenManager{secret: []byte(secret)}, nil
}

func (m *TokenManager) NewAccessToken(userID int64) (string, error) {
	return m.sign(Claims{UserID: userID, Type: "access", Expires: time.Now().Add(accessTokenLifetime).Unix()})
}

func (m *TokenManager) ValidateAccessToken(token string) (int64, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return 0, errors.New("invalid token")
	}
	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return 0, errors.New("invalid token")
	}
	mac := hmac.New(sha256.New, m.secret)
	mac.Write([]byte(parts[0] + "." + parts[1]))
	if !hmac.Equal(signature, mac.Sum(nil)) {
		return 0, errors.New("invalid token")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return 0, errors.New("invalid token")
	}
	var claims Claims
	if err := json.Unmarshal(payload, &claims); err != nil || claims.Type != "access" || claims.UserID < 1 || claims.Expires <= time.Now().Unix() {
		return 0, errors.New("invalid or expired token")
	}
	return claims.UserID, nil
}

func (m *TokenManager) sign(claims Claims) (string, error) {
	header, err := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	if err != nil {
		return "", err
	}
	payload, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	encoded := base64.RawURLEncoding.EncodeToString(header) + "." + base64.RawURLEncoding.EncodeToString(payload)
	mac := hmac.New(sha256.New, m.secret)
	if _, err := mac.Write([]byte(encoded)); err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}
	return encoded + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil)), nil
}
