package recurring

import (
	"github.com/gin-gonic/gin"
	"github.com/oguiizim/finora/auth"
	"net/http"
	"strconv"
	"time"
)

type Handler struct{ service *Service }

func InitHandler(s *Service) *Handler { return &Handler{s} }
func id(c *gin.Context) (int64, bool) {
	v, e := strconv.ParseInt(c.Param("id"), 10, 64)
	if e != nil || v < 1 {
		c.JSON(400, gin.H{"error": "invalid recurring expense id"})
		return 0, false
	}
	return v, true
}
func (h *Handler) Create(c *gin.Context) {
	var r UpsertExpense
	if e := c.ShouldBindJSON(&r); e != nil {
		c.JSON(400, gin.H{"error": e.Error()})
		return
	}
	v, e := h.service.Create(auth.UserID(c), r)
	if e != nil {
		c.JSON(400, gin.H{"error": e.Error()})
		return
	}
	c.JSON(201, gin.H{"recurring_expense": v})
}
func (h *Handler) List(c *gin.Context) {
	v, e := h.service.List(auth.UserID(c))
	if e != nil {
		c.JSON(500, gin.H{"error": e.Error()})
		return
	}
	c.JSON(200, gin.H{"recurring_expenses": v})
}
func (h *Handler) Update(c *gin.Context) {
	v, ok := id(c)
	if !ok {
		return
	}
	var r UpsertExpense
	if e := c.ShouldBindJSON(&r); e != nil {
		c.JSON(400, gin.H{"error": e.Error()})
		return
	}
	item, e := h.service.Update(auth.UserID(c), v, r)
	if e != nil {
		status := 400
		if e.Error() == "recurring expense not found" {
			status = 404
		}
		c.JSON(status, gin.H{"error": e.Error()})
		return
	}
	c.JSON(200, gin.H{"recurring_expense": item})
}
func (h *Handler) Delete(c *gin.Context) {
	v, ok := id(c)
	if !ok {
		return
	}
	if e := h.service.Delete(auth.UserID(c), v); e != nil {
		c.JSON(404, gin.H{"error": e.Error()})
		return
	}
	c.Status(204)
}
func (h *Handler) Projection(c *gin.Context) {
	months, _ := strconv.Atoi(c.DefaultQuery("months", "12"))
	p, e := h.service.Projection(auth.UserID(c), months, time.Now())
	if e != nil {
		c.JSON(500, gin.H{"error": e.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"projection": p})
}

func (h *Handler) Simulate(c *gin.Context) {
	var req UpsertExpense
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	months, _ := strconv.Atoi(c.DefaultQuery("months", "12"))
	p, err := h.service.Simulate(auth.UserID(c), months, time.Now(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"projection": p})
}
