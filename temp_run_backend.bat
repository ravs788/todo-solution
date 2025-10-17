@echo off
cd todo-backend
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=h2" -X
