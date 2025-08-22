#!/bin/bash
# Run Playwright end-to-end tests with dependency installation

cd "$(dirname "$0")" || exit 1
cd .. || exit 1
echo "Installing Playwright dependencies..."
cd tests-e2e || exit 1
npm install
npx playwright install --with-deps
echo "Running Playwright tests..."
npx playwright test
