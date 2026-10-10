#!/bin/bash

set -e

echo "Running migrations..."

go run ./cmd/migrate/migrate.go

echo "Migrations done"