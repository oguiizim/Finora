#!/bin/bash

set -e

echo "Seeding tables"

go run ./cmd/seed/seed.go

echo "Seed done"