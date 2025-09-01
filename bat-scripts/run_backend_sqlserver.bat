@echo off
REM Change to the parent directory of this script (project root)
cd /d "%~dp0.."
cd todo-backend
REM By default, this will use application.properties with SQL Server config.
REM If you use a specific Spring profile (e.g., 'sqlserver'), set it below:
REM mvn spring-boot:run -Dspring-boot.run.profiles=sqlserver
mvn spring-boot:run
