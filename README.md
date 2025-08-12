# Todo Solution

This repository provides a fullstack Todo application with:

- **Frontend**: React (in `todo-frontend/`)
- **Backend**: Spring Boot (in `todo-backend/`)
- **E2E**: Playwright automation (in `todo-e2e/`)

---

## Frontend

**Location:** `todo-frontend/`

### How to Run

1. `cd todo-frontend`
2. `npm install`
3. `npm start`  
   Frontend available at [http://localhost:3000](http://localhost:3000)

### Scripts

- `npm start` – start development server
- `npm test` – run unit tests
- `npm run build` – build app for production

### Notes

- The frontend proxies API requests to [http://localhost:8081](http://localhost:8081) by default.

---

## Backend

**Location:** `todo-backend/`

### How to Run

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

- **JWT-secured endpoints for Todo management**
- **User registration, admin approval, login**
- **Forgot/reset password endpoints:**
  - `POST /api/auth/forgot-password` — requests a password reset
  - `POST /api/auth/reset-password` — resets password with provided token
- **Swagger/OpenAPI provided for interactive API docs (Springdoc OpenAPI UI)**
- **Unit and integration tests** (JUnit 5, tagged in Java source)

---

## End-to-End (E2E) Tests

- Located in `todo-e2e/`, powered by Playwright.
- **All E2E and CI pipelines are currently disabled.**  
  To re-enable, uncomment relevant `.github/workflows/*.yml` files.

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

For further details on code or configuration, see `flow-diagram.md` for architecture and API flow.
