@echo off
REM Change to the parent directory of this script (project root)
cd /d "%~dp0.."
cd todo-backend
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=h2"
