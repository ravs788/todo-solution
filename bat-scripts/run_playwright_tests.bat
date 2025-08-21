@echo off
REM Change to the parent directory of this script (project root)
cd /d "%~dp0.."
echo Running Playwright E2E tests...
npx playwright test
