#!/bin/bash
# Clean backend test results and run backend tests

cd "$(dirname "$0")/.." || exit 1
echo "Cleaning backend test results..."
rm -rf todo-backend/allure-results
rm -rf todo-backend/target
echo "Running backend tests..."
cd todo-backend || exit 1
mvn clean test
