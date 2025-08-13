# Todo Solution

This repository provides a fullstack Todo application with:

- **Frontend**: React (in `todo-frontend/`)
- **Backend**: Spring Boot (in `todo-backend/`)

---

## Frontend

**Location:** `todo-frontend/`

### How to Run

**Requires Node.js and npm. Uses [react-app-rewired](https://github.com/timarney/react-app-rewired) for configuration overrides.**

1. `cd todo-frontend`
2. `npm install`
3. `npm start`  
   Frontend available at [http://localhost:3000](http://localhost:3000)

### Scripts

- `npm start` – start development server (uses `react-app-rewired start`)
- `npm test` – run unit tests (uses `react-app-rewired test`)
- `npm run build` – build app for production (uses `react-app-rewired build`)
- `npm run e2e` – run Playwright end-to-end tests (if present)

### Key Dependencies

- **react** (^19.1.0)
- **react-router-dom** (^6.22.2)
- **bootstrap** (^5.3.7)
- **axios** (^1.10.0)
- **@testing-library/react** (unit testing)
- **Playwright** (E2E testing, devDependency)

### Structure

- `/src/components/` – main React components and tests
- `/src/context/` – React context providers (e.g., Auth)
- `/public/` – static assets

### Notes

- The frontend proxies API requests to [http://localhost:8081](http://localhost:8081) by default.

---

## Backend

**Location:** `todo-backend/`

### How to Run

**Requires Java 17+ and Maven.**

- Requires a running **SQL Server instance**.
- Update `todo-backend/src/main/resources/application.properties` with your MSSQL connection information.
- Start the app with:
  ```
  cd todo-backend
  mvn spring-boot:run
  ```
- Backend will be available at [http://localhost:8081](http://localhost:8081)

### Seed/Admin User

- On first run, a default admin user is seeded:
  - **Username:** `admin`
  - **Password:** `password`

---

## API Features

- **Spring Boot 3.3, Java 17**
- **Maven build and dependency management**
- **JWT-secured endpoints for Todo management**
- **User registration, admin approval, login**
- **Direct password reset (no email, no token)**
- **Forgot/reset password endpoints:**
  - `POST /api/auth/forgot-password` — resets password directly (username, newPassword required; no email or token sent/needed)
  - `POST /api/auth/reset-password` — (stub; not used in main flow)
- **Swagger/OpenAPI provided for interactive API docs (Springdoc OpenAPI UI)**
- **Admin Panel for managing/approving user accounts**
- **Allure reporting enabled on tests** (`allure-results/`, `allure-report/`)
- **Unit and integration tests** (JUnit 5, tagged in Java source)

---


## Continuous Integration / Deployment

- **All GitHub Actions workflows are fully commented out and inactive** to prevent any automated testing or deployment in CI/CD until reinstated.
- To reactivate, uncomment lines in `.github/workflows/*.yml`.

---

## Developer Notes

- **SQL Server is required** for backend in all environments (dev, test, production).
- **Unit tests:** `@Tag("unit")`  
  **Integration tests:** `@Tag("integration")`.
- Initial admin user always created for new DBs.

---

## Quickstart for Local Dev

1. Ensure SQL Server is running and accessible.
2. Configure connection info in `application.properties` if needed.
3. Start backend:
   ```
   cd todo-backend
   mvn spring-boot:run
   ```
4. Start frontend:
   ```
   cd todo-frontend
   npm install
   npm start
   ```
5. Access app in browser.

---

For further details on code or configuration, see `flow-diagram.md` for updated architecture and latest API flow (including admin approval and direct password reset).
