@echo off
cd /d "%~dp0"
echo Cleaning frontend test results...
rmdir /s /q "todo-frontend\test-results"
rmdir /s /q "todo-frontend\allure-report"
echo Running frontend tests...
cd todo-frontend
npm test -- --ci --watchAll=false
cd ..
