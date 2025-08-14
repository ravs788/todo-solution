#!/bin/bash
# Start the Spring Boot backend server

cd "$(dirname "$0")/.." || exit 1
cd todo-backend || exit 1
mvn spring-boot:run
