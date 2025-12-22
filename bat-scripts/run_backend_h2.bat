@echo off
REM Change to the project root
cd /d "%~dp0.."
cd todo-backend

REM Run the Spring Boot app using the H2 profile
set "SPRING_PROFILES_ACTIVE=h2"
echo Starting backend with H2 profile on port 8081...
mvn spring-boot:run -Dspring-boot.run.profiles=h2
