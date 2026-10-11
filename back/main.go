package main

import (
	"log"
	"net/http"
	"os"

	"github.com/oguiizim/finora/server"
)

func main() {
	handler, err := server.NewHandler()
	if err != nil {
		log.Fatal(err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	address := ":" + port
	log.Printf("API listening on %s", address)
	if err := http.ListenAndServe(address, handler); err != nil {
		log.Fatal(err)
	}
}
