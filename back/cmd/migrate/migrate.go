package main

import (
	"log"
	"github.com/oguiizim/finora/database"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
	_ "modernc.org/sqlite"
	_ "turso.tech/database/tursogo"
)

func main() {
	localDb, err := database.NewLocalConnection()
	if err != nil {
		log.Fatal(err)
	}
	cloudDb, err := database.NewCloudConnection()
	if err != nil {
		log.Fatal(err)
	}
	database.ExecMigrations(localDb, "local.db")
	database.ExecMigrations(cloudDb, "finora.db")
	defer localDb.Close()
	defer cloudDb.Close()
}
