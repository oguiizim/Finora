package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
	_ "modernc.org/sqlite"
	_ "turso.tech/database/tursogo"
)

type Migration struct {
	Id        int64
	Name      string
	Updated   bool
	CratedAt  time.Time
	UpdatedAt time.Time
}

func NewCloudConnection() (*sql.DB, error) {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		log.Fatal(err)
	}
	dsn := os.Getenv("DATABASE_URL") + "?authToken=" + os.Getenv("DATABASE_AUTH_TOKEN")
	driver := "libsql"
	database, err := sql.Open(driver, dsn)
	if err != nil {
		database.Close()
		return nil, err
	}
	return database, nil
}

func NewLocalConnection() (*sql.DB, error) {
	dsn := "file:local.db"
	driver := "sqlite"
	database, err := sql.Open(driver, dsn)
	if err != nil {
		database.Close()
		return nil, err
	}
	return database, nil
}

func SeedDatabase(db *sql.DB) {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS migrations(
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		updated BOOLEAN DEFAULT (false),
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		updated_at TEXT DEFAULT (datetime('now'))
		);`)
	if err != nil {
		log.Fatal(err)
	}
}

func ExecMigrations(database *sql.DB, name string) {
	dir := "./" + os.Getenv("DIRECTORY")

	files, err := os.ReadDir(dir)
	if err != nil {
		log.Fatal(err)
	}

	for _, file := range files {
		if file.IsDir() || filepath.Ext(file.Name()) != ".sql" {
			continue
		}

		var migration Migration

		err := database.QueryRow(`
            SELECT id, name, updated
            FROM migrations
            WHERE name = ?
        `, file.Name()).Scan(
			&migration.Id,
			&migration.Name,
			&migration.Updated,
		)

		if err == sql.ErrNoRows {
			_, err := database.Exec(`
                INSERT INTO migrations (name, updated, created_at, updated_at)
                VALUES (?, ?, ?, ?)
            `, file.Name(), false, time.Now().Format("2006-01-02 15:04:05"), time.Now().Format("2006-01-02 15:04:05"))

			if err != nil {
				log.Fatal(err)
			}

			err = database.QueryRow(`
                SELECT id, name, updated
                FROM migrations
                WHERE name = ?
            `, file.Name()).Scan(
				&migration.Id,
				&migration.Name,
				&migration.Updated,
			)

			if err != nil {
				log.Fatal(err)
			}

		} else if err != nil {
			log.Fatal(err)
		}

		if !migration.Updated {
			path := filepath.Join(dir, file.Name())

			data, err := os.ReadFile(path)
			if err != nil {
				log.Fatal(err)
			}

			if _, err := database.Exec(string(data)); err != nil {
				log.Fatal(err)
			}

			if _, err := database.Exec(`
                UPDATE migrations
                SET updated = true, updated_at = ?
                WHERE id = ?
            `, time.Now().Format("2006-01-02 15:04:05"), migration.Id); err != nil {
				log.Fatal(err)
			}

			log.Printf("Migration: %s | Database: %s", file.Name(), name)
		}
	}
}
