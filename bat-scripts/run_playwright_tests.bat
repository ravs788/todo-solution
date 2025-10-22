@echo off
echo Changing to E2E tests directory...
cd tests-e2e

echo Installing E2E test dependencies...
call npm install

echo Installing Playwright browsers and dependencies...
call npx playwright install --with-deps

echo Running Playwright E2E tests in headed mode...
call npx playwright test ui-tests/todo-crud-user.spec.ts --headed

echo Done.
