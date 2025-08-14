#!/bin/bash
# Clean frontend test results and run frontend tests

cd "$(dirname "$0")/.." || exit 1
echo "Cleaning frontend test results..."
rm -rf todo-frontend/test-results
rm -rf todo-frontend/allure-report
echo "Running frontend tests..."
cd todo-frontend || exit 1
npm test -- --ci --watchAll=false
