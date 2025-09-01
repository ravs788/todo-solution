# Todo Solution

<!-- 
  BADGES: To keep visually organized, badges are grouped into:
  1. Repo metadata/activity
  2. Build & CI/CD
  3. Technology & community
-->

<!-- 1. Repo Metadata -->
[![Issues](https://img.shields.io/github/issues/ravs788/todo-solution)](https://github.com/ravs788/todo-solution/issues) [![Forks](https://img.shields.io/github/forks/ravs788/todo-solution?style=social)](https://github.com/ravs788/todo-solution/network/members) [![Stars](https://img.shields.io/github/stars/ravs788/todo-solution?style=social)](https://github.com/ravs788/todo-solution/stargazers) [![Contributors](https://img.shields.io/github/contributors/ravs788/todo-solution)](https://github.com/ravs788/todo-solution/graphs/contributors) [![Last Commit](https://img.shields.io/github/last-commit/ravs788/todo-solution)](https://github.com/ravs788/todo-solution/commits/main)

<!-- 2. Build & CI/CD -->
[![Merge Regression CI](https://github.com/ravs788/todo-solution/actions/workflows/merge-tests.yml/badge.svg?branch=main)](https://github.com/ravs788/todo-solution/actions/workflows/merge-tests.yml) [![PR Smoke CI](https://github.com/ravs788/todo-solution/actions/workflows/pr-tests.yml/badge.svg)](https://github.com/ravs788/todo-solution/actions/workflows/pr-tests.yml) [![Build Status](https://github.com/ravs788/todo-solution/actions/workflows/merge-tests.yml/badge.svg?branch=main)](https://github.com/ravs788/todo-solution/actions/workflows/merge-tests.yml)

<!-- 3. Tech & Community -->
[![Java](https://img.shields.io/badge/backend-Java_17-blue?logo=java&logoColor=white)](todo-backend/) [![React](https://img.shields.io/badge/frontend-React_19-61dafb?logo=react&logoColor=white)](todo-frontend/) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](../../pulls) [![Made with ❤️](https://img.shields.io/badge/Made%20with-Love-ff69b4)](https://github.com/)

---

## 🚀 Features

- Full-stack **Todo app**: Java Spring Boot backend + React frontend
- **Admin approval** required before new users can log in
- Secure **JWT-based authentication**
- **Direct password reset** (no token/email required)
- **SQL Server database** in all environments (Azure SQL compatible)
- Interactive **Admin Panel**: approve/reject users, manage accounts
- **Allure reporting** on backend Java tests
- **Unit/integration tests** for both backend and frontend (JUnit 5, Testing Library)
- **Playwright E2E** frontend tests covering main user flows, regression, and smoke checks
- **Swagger/OpenAPI** UI on backend for live API docs
- Easy deploy to **Azure App Service** (backend) and **Azure Static Web Apps** (frontend)
- **React Context API** for user/auth state management
- **Bootstrap styling** throughout

---

## 📂 Project Structure

```plaintext
todo-solution/
│
├── todo-backend/           # Spring Boot backend (Java 17+)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/todobackend/
│   │   │   │   ├── controller/
│   │   │   │   ├── dto/
│   │   │   │   ├── model/
│   │   │   │   ├── repository/
│   │   │   │   ├── security/
│   │   │   │   └── service/
│   │   │   └── resources/
│   │   │       └── application.properties      # DB config
│   │   └── test/
│   │       └── java/com/example/todobackend/
│   └── pom.xml
│
├── todo-frontend/           # React frontend (Node.js/npm)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── test/            # Frontend Jest unit/integration tests
│   ├── package.json
│   └── .env
│
├── tests-e2e/               # Playwright E2E test suite (cross-browser)
│   ├── models/              # Test models (e.g. User, Todo)
│   ├── pages/               # Playwright Page Object Models (POMs)
│   ├── test-data/           # JSON datasets for parameterization
│   ├── tests/               # *.spec.ts End-to-end Playwright specs
│   ├── playwright-report/   # HTML results (after run)
│   └── test-results/        # Raw results, traces, screenshots
│
├── flow-diagram.md          # Architecture & E2E flow diagrams
└── README.md

```

---

##  Playwright E2E Features

- **Cross-browser** E2E for Chromium, Firefox, WebKit
- **Page Object Model (POM):** LoginPage, HomePage, TodoPage, etc.
- **Fully headless/parallel or headed runs**
- **Data-driven:** Loads sample users/todos from `test-data/`
- **Parameterized tests:** Data-driven per-user and per-scenario runs
- **Tag & grep:** Add `@smoke`, `@regression`, etc. in test titles and filter with `--grep`
- **CI artifacts:** HTML + traces uploaded after every run for debugging

---

## 📣 CI/CD Workflows

- **Reusable CI template:** See `.github/workflows/reusable-test-template.yml`
- **E2E runs on Chromium-only in CI, all browsers locally**
- **Backend and frontend** are built, then both are started in the background (backend with H2), and `wait-on` utility ensures they are up before E2E tests start.
- **Playwright runs from `tests-e2e` only**; no global install required or used.
- **Worker/thread configuration:** 5 threads locally for quick feedback, sequential in CI for safety and reproducibility.
- **Test/report folders are .gitignored everywhere.**
- Playwright HTML reporting included; open with `npx playwright show-report`
- All backend, frontend, and E2E runs upload reports for review

---

## 🏗️ Test Tagging & Filtering

You can selectively run tests using `--grep` and tags like `@smoke` and `@regression` found in test titles.

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
```

---

##  Reporting & CI

- All major browsers covered in CI matrix (Chromium, Firefox, WebKit)
- Playwright HTML reporting included; open with `npx playwright show-report`
- All backend, frontend, and E2E runs upload reports for review

---

##  Diagrams & Architecture

See [flow-diagram.md](flow-diagram.md) for:
1. User journey & sequence diagrams (including E2E flow)
2. Test structure showing interaction of specs, POM, and test data

---

## 🖥️ Scripts

Scripts are provided for starting services and running tests (Windows: `bat-scripts/`, Mac/Linux: `sh-scripts/`). See description in this file above.

---

## 📦 Running and Testing the Application: Automation Scripts

To quickly start or test the application, use the included batch/shell scripts for your platform.
These scripts handle changing to the right directory and (on Windows) also handle dependency install (where needed).

### 📂 Script Locations

- **Windows (.bat)**: [`bat-scripts/`](bat-scripts/)
- **Mac/Linux (.sh)**: [`sh-scripts/`](sh-scripts/)

---

### 🚦 Start the Application

#### Windows

- **Start Backend (H2, default):**  
  ```
  bat-scripts\run_backend.bat
  ```
  Starts the Spring Boot backend **using the in-memory H2 database** (default, zero config).

- **Start Backend (SQL Server, optional):**
  ```
  bat-scripts\run_backend_sqlserver.bat
  ```
  Starts the Spring Boot backend with SQL Server configuration (ensure `application.properties` is set for SQL Server).
  > By default, this script uses your settings in `todo-backend/src/main/resources/application.properties` (JDBC URL, username, password).
  > If you use a specific Spring profile, update the script to run `mvn spring-boot:run -Dspring-boot.run.profiles=sqlserver`

- **Start Frontend:**  
  ```
  bat-scripts\run_frontend.bat
  ```
  Installs frontend dependencies and starts the React app.

#### Mac/Linux

- **Start Backend:**  
  ```
  bash sh-scripts/run_backend.sh
  ```
  Starts the Spring Boot backend **using the in-memory H2 database** (default, zero config).

  > **To use SQL Server instead of H2:**  
  By default, scripts run with the H2 profile for local development.
  If you want to use SQL Server:
  1. Edit `todo-backend/src/main/resources/application.properties` and set your SQL Server JDBC settings (see file comments).
  2. Start the backend manually (not via script) without the H2 profile:
     ```
     cd todo-backend
     mvn spring-boot:run
     ```
  3. Or, if you have a custom profile (e.g., `sqlserver`), use:
     ```
     mvn spring-boot:run -Dspring-boot.run.profiles=sqlserver
     ```

- **Start Frontend:**  
  ```
  bash sh-scripts/run_frontend.sh
  ```
  *Note:* If running for the first time, run `npm install` in `todo-frontend` before starting:
  ```
  cd todo-frontend
  npm install
  ```

---

### ✅ Run Tests (Unit/Integration)

#### Windows

- **Backend Tests:**  
  ```
  bat-scripts\run_backend_tests.bat
  ```
- **Frontend Tests:**  
  ```
  bat-scripts\run_frontend_tests.bat
  ```
- **All Tests (backend + frontend):**  
  ```
  bat-scripts\run_all_tests.bat
  ```

#### Mac/Linux

- **Backend Tests:**  
  ```
  bash sh-scripts/run_backend_tests.sh
  ```
- **Frontend Tests:**  
  ```
  bash sh-scripts/run_frontend_tests.sh
  ```
- **All Tests (backend + frontend):**  
  ```
  bash sh-scripts/run_all_tests.sh
  ```
  *Note:* For first-time use, install frontend dependencies with:
  ```
  cd todo-frontend
  npm install
  ```

---

### 🤖 Run E2E (Playwright) Tests

#### Windows

- ```
  bat-scripts\run_playwright_tests.bat
  ```

#### Mac/Linux

- ```
  bash sh-scripts/run_playwright_tests.sh
  ```
  *Note:* On first run or after dependency updates:
  ```
  cd tests-e2e
  npm install
  ```

---

### 🔍 Explore the Scripts

See script source in [`bat-scripts/`](bat-scripts/) and [`sh-scripts/`](sh-scripts/) for further details or custom usage.

---

## 🤝 Contributing

PRs and suggestions are welcome! Please open issues or submit pull requests. Run the full test suite, including E2E, before submitting for review.

---

## Recent Changes

### Tag Management and Editing
- Tag update operations in the UI and Playwright E2E tests are now robust and performed before form submission.
- Page Object and backend flows for tag editing and chip validation were improved to ensure tags are properly saved.

### E2E Test Improvements
- The update tags E2E flow was unified to open the edit form, set tags, and submit, matching real user actions.
- Test logic now avoids selector ambiguity, removes debug code, and ensures assertions are properly scoped.

### Pagination and Page Size Selection
- The Todo List UI now supports a "Rows per page" dropdown with options for 5, 10 (default), and 25.
- The dropdown is displayed to the far right of the pagination controls below the table, while the Prev/Next controls remain centered.

## 📄 License

MIT
