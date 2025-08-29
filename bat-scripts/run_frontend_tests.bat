@echo off
REM Change to the parent directory of this script (project root)
cd /d "%~dp0.."
echo Cleaning frontend test results...
rmdir /s /q "todo-frontend\test-results"
rmdir /s /q "todo-frontend\allure-report"
echo Running frontend tests...
cd todo-frontend
call npm install
if %errorlevel% neq 0 (
    echo "npm install failed"
    exit /b %errorlevel%
)
call npm test -- --ci --watchAll=false
if %errorlevel% neq 0 (
    echo "npm test failed"
    exit /b %errorlevel%
)
cd ..
