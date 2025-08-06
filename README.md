# Todo Solution

This project contains both the frontend and backend solutions for a Todo application.

## Frontend

The frontend is a React application located in the `todo-frontend` directory. To run it, follow these steps:

1. Navigate to the `todo-frontend` directory.
2. Run `npm install` to install the dependencies.
3. Run `npm start` to start the application.

The frontend will be available at `http://localhost:3000`.

## Backend

The backend is a Spring Boot application located in the `todo-backend` directory. To run it, follow these steps:

1. Navigate to the `todo-backend` directory.
2. Run `mvn spring-boot:run` to start the application.

The backend will be available at `http://localhost:8081`.

## Running the Applications

To simplify the process, you can use the provided batch files:

- `run_frontend_with_install.bat` will install the frontend dependencies and start the frontend application.
- Ensure you have Maven and Node.js installed on your system to run the backend and frontend applications, respectively.

## Notes

- Make sure to check the `application.properties` file in the `todo-backend/src/main/resources` directory for database configuration.
- The frontend is configured to proxy requests to the backend at `http://localhost:8081`.
