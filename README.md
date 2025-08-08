# Todo Solution

This project contains both the frontend and backend solutions for a Todo application.

## Frontend

The frontend is a React application located in the `todo-frontend` directory.

### How to Run

1. Navigate to the `todo-frontend` directory.
2. Run `npm install` to install the dependencies.
3. Run `npm start` to start the application.

The frontend will be available at [http://localhost:3000](http://localhost:3000).

### Available Scripts

In the `todo-frontend` directory, the following npm scripts are available:

- **`npm start`**  
  Runs the app in development mode at [http://localhost:3000](http://localhost:3000). The page reloads on file changes. You may see any lint errors in the console.

- **`npm test`**  
  Launches the test runner in interactive watch mode.  
  See the [running tests documentation](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

- **`npm run build`**  
  Builds the app for production to the `build` folder. It bundles React in production mode and optimizes the build for the best performance. See the [deployment documentation](https://facebook.github.io/create-react-app/docs/deployment).

- **`npm run eject`**  
  See [eject documentation](https://facebook.github.io/create-react-app/docs/available-scripts#npm-run-eject). You only need this if you want to customize the default build configuration.

For further React and Create React App documentation, visit:
- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React Documentation](https://reactjs.org/)

---

## Backend

The backend is a Spring Boot application located in the `todo-backend` directory.

### How to Run

1. Navigate to the `todo-backend` directory.
2. Run `mvn spring-boot:run` to start the application.

The backend will be available at [http://localhost:8081](http://localhost:8081).

---

## Running the Applications

To simplify the process, you can use the provided batch files at the root:

- `run_frontend_with_install.bat` will install the frontend dependencies and start the frontend application.

**Prerequisites:** Make sure you have Maven and Node.js installed on your system to run the backend and frontend applications, respectively.

---

## Notes

- Check the `application.properties` file in the `todo-backend/src/main/resources` directory for backend/database configuration.
- The frontend is configured to proxy requests to the backend at [http://localhost:8081](http://localhost:8081).
