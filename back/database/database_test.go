package database

import "testing"

func TestGetDatabaseConfig(t *testing.T) {
	t.Setenv("USE_CLOUD", "false")
	t.Setenv("DATABASE_NAME", "test.db")
	dsn, driver, err := GetDatabaseConfig()
	if err != nil || dsn != "file:test.db" || driver != "sqlite" {
		t.Fatalf("local config = %q, %q, %v", dsn, driver, err)
	}
}

func TestGetDatabaseConfigCloudEnvironments(t *testing.T) {
	for _, test := range []struct{ node, prefix string }{{"development", "DEV"}, {"production", "PROD"}} {
		t.Run(test.node, func(t *testing.T) {
			t.Setenv("USE_CLOUD", "true")
			t.Setenv("NODE", test.node)
			t.Setenv("DEV_DATABASE_URL", "libsql://dev")
			t.Setenv("DEV_DATABASE_AUTH_TOKEN", "dev-token")
			t.Setenv("PROD_DATABASE_URL", "libsql://prod")
			t.Setenv("PROD_DATABASE_AUTH_TOKEN", "prod-token")
			dsn, driver, err := GetDatabaseConfig()
			if err != nil || driver != "libsql" || dsn == "" {
				t.Fatalf("cloud config = %q, %q, %v", dsn, driver, err)
			}
		})
	}
}
