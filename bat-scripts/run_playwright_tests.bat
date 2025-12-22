@echo off
echo Changing to E2E tests directory...
cd tests-e2e

echo Installing E2E test dependencies...
call npm install

echo Installing Playwright browsers and dependencies...
call npx playwright install --with-deps

echo Running Playwright E2E tests (headless by default; pass --headed to run with UI)...
call npx playwright test %*

echo Done.
