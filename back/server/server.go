package server

import (
	"database/sql"
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/oguiizim/finora/category"
	"github.com/oguiizim/finora/database"
	"github.com/oguiizim/finora/transaction"
)

func NewHandler() (http.Handler, error) {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		return nil, err
	}

	db, err := connectDatabase()
	if err != nil {
		return nil, err
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), corsMiddleware())
	registerRoutes(router.Group("/api"), db)
	return router, nil
}

func connectDatabase() (*sql.DB, error) {
	if os.Getenv("USE_CLOUD") == "true" {
		if os.Getenv("DATABASE_URL") == "" || os.Getenv("DATABASE_AUTH_TOKEN") == "" {
			return nil, errors.New("DATABASE_URL and DATABASE_AUTH_TOKEN are required when USE_CLOUD=true")
		}
		return database.NewCloudConnection()
	}
	if os.Getenv("VERCEL") == "1" {
		return nil, errors.New("USE_CLOUD=true is required on Vercel; local SQLite storage is ephemeral")
	}
	return database.NewLocalConnection()
}

func registerRoutes(api *gin.RouterGroup, db *sql.DB) {
	categoryHandler := category.InitHandler(category.InitService(category.InitRepository(db)))
	transactionHandler := transaction.InitHandler(transaction.InitService(transaction.InitRepository(db)))

	categories := api.Group("/category")
	categories.POST("/", categoryHandler.Create)
	categories.PUT("/:id", categoryHandler.Edit)
	categories.DELETE("/:id", categoryHandler.Delete)
	categories.GET("/all", categoryHandler.GetAll)
	categories.GET("/:id", categoryHandler.GetById)

	transactions := api.Group("/transaction")
	transactions.POST("/", transactionHandler.Create)
	transactions.GET("/all", transactionHandler.GetAll)
	transactions.GET("/summary", transactionHandler.Summary)
	transactions.GET("/:id", transactionHandler.GetByID)
	transactions.PUT("/:id", transactionHandler.Update)
	transactions.DELETE("/:id", transactionHandler.Delete)

	api.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"message": "Server is on!"}) })
}

func corsMiddleware() gin.HandlerFunc {
	origins := allowedOrigins()
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" && origins[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func allowedOrigins() map[string]bool {
	origins := map[string]bool{"http://localhost:3000": true}
	for _, origin := range strings.Split(os.Getenv("FRONTEND_ORIGINS"), ",") {
		if origin = strings.TrimSpace(origin); origin != "" {
			origins[origin] = true
		}
	}
	return origins
}
