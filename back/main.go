package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/oguiizim/finora/category"
	"github.com/oguiizim/finora/database"
)

func main() {
	router := gin.Default()
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		log.Fatal(err)
	}
	useCloud := os.Getenv("USE_CLOUD") == "true"
	var db *sql.DB
	var err error
	if useCloud {
		db, err = database.NewCloudConnection()
	} else {
		db, err = database.NewLocalConnection()
	}
	if err != nil {
		log.Fatal(err)
	}
	api := router.Group("/api")

	categoryR := category.InitRepository(db)
	categoryS := category.InitService(categoryR)
	categoryH := category.InitHandler(categoryS)

	registerRoutes(api, categoryH)

	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Server is on!",
		})
	})
	err = router.Run(":8080")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
}

func registerRoutes(router *gin.RouterGroup, categoryHandler *category.Handler) {
	categoryRouter := router.Group("/category")
	categoryRouter.POST("/", categoryHandler.Create)
	categoryRouter.PUT("/:id", categoryHandler.Edit)
	categoryRouter.GET("/all", categoryHandler.GetAll)
	categoryRouter.GET("/:id", categoryHandler.GetById)
}
