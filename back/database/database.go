package database

import (
	"database/sql"
	"errors"
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

// New opens the configured database. USE_CLOUD=false uses local SQLite; when it
// is true, NODE=development selects DEV_* credentials and any other NODE value
// selects PROD_* credentials.
func New() (*sql.DB, string, error) {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		return nil, "", err
	}
	dsn, driver, err := GetDatabaseConfig()
	if err != nil {
		return nil, "", err
	}
	db, err := sql.Open(driver, dsn)
	if err != nil {
		return nil, dsn, err
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, dsn, err
	}
	return db, dsn, nil
}

func GetDatabaseConfig() (dsn, driver string, err error) {
	if os.Getenv("USE_CLOUD") != "true" {
		name := os.Getenv("DATABASE_NAME")
		if name == "" {
			name = "local.db"
		}
		return "file:" + name, "sqlite", nil
	}
	urlKey, tokenKey := "PROD_DATABASE_URL", "PROD_DATABASE_AUTH_TOKEN"
	if os.Getenv("NODE") == "development" {
		urlKey, tokenKey = "DEV_DATABASE_URL", "DEV_DATABASE_AUTH_TOKEN"
	}
	url, token := os.Getenv(urlKey), os.Getenv(tokenKey)
	if url == "" || token == "" {
		return "", "", errors.New(urlKey + " and " + tokenKey + " are required when USE_CLOUD=true")
	}
	return url + "?authToken=" + token, "libsql", nil
}

// Kept as compatibility helpers for callers that need an explicit target.
func NewCloudConnection() (*sql.DB, error) { db, _, err := New(); return db, err }
func NewLocalConnection() (*sql.DB, error) {
	db, err := sql.Open("sqlite", "file:local.db")
	if err != nil {
		return nil, err
	}
	return db, nil
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
