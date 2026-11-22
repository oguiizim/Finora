#!/bin/bash

set -e

./back/run.sh &
./front/run.sh
