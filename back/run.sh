#!/bin/bash

set -e

echo "Starting the server..."

go build main.go

./main.exe
