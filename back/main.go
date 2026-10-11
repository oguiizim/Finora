package main

import (
	"log"
	"net/http"

	"github.com/oguiizim/finora/server"
)

func main() {
	handler, err := server.NewHandler()
	if err != nil {
		log.Fatal(err)
	}

	log.Println("API listening on :8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal(err)
	}
}
