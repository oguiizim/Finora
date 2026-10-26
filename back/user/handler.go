package user

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/oguiizim/finora/auth"
)

type Handler struct{ service *Service }

func InitHandler(service *Service) *Handler { return &Handler{service: service} }
func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	session, err := h.service.Register(req)
	h.respondSession(c, session, err, http.StatusCreated)
}
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	session, err := h.service.Login(req)
	h.respondSession(c, session, err, http.StatusOK)
}
func (h *Handler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	session, err := h.service.Refresh(req.RefreshToken)
	h.respondSession(c, session, err, http.StatusOK)
}
func (h *Handler) Logout(c *gin.Context) {
	if err := h.service.Logout(auth.UserID(c)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not logout"})
		return
	}
	c.Status(http.StatusNoContent)
}
func (h *Handler) Me(c *gin.Context) {
	u, err := h.service.Me(auth.UserID(c))
	if errors.Is(err, ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": u})
}
func (h *Handler) respondSession(c *gin.Context, session *Session, err error, success int) {
	if errors.Is(err, ErrInvalidCredentials) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(success, session)
}
