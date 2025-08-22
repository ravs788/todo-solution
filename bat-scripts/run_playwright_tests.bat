@echo off
REM Change to the parent directory of this script (project root)
cd /d "%~dp0.."

echo Changing to E2E tests directory...
cd tests-e2e

echo Installing E2E test dependencies...
call npm install

echo Installing Playwright browsers and dependencies...
call npx playwright install --with-deps

echo Running Playwright E2E tests...
call npx playwright test

echo Done.
