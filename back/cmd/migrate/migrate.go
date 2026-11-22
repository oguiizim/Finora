package main

import (
	"github.com/oguiizim/finora/database"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
	"log"
	_ "modernc.org/sqlite"
	_ "turso.tech/database/tursogo"
)

func main() {
	db, name, err := database.New()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	database.ExecMigrations(db, name)
}
