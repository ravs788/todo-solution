@echo off
REM Change to the parent directory of this script (project root)
cd /d "%~dp0.."
echo Cleaning backend test results...
rmdir /s /q "todo-backend\allure-results"
rmdir /s /q "todo-backend\target"
echo Running backend tests...
cd todo-backend
mvn clean test
cd ..
