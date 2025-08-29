@echo off
REM Change to the parent directory of this script (project root)
cd /d "%~dp0.."
cd todo-frontend
call npm install
if %errorlevel% neq 0 (
    echo "npm install failed"
    exit /b %errorlevel%
)
call npm start
if %errorlevel% neq 0 (
    echo "Failed to start frontend development server"
    exit /b %errorlevel%
)
