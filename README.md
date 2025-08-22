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

## 📝 Quickstart

### Setup, Start, and Test

```bash
git clone <repo-url>
cd todo-solution/

# Start backend (Java)
cd todo-backend
mvn spring-boot:run

# In a separate terminal...
cd ../todo-frontend
npm install
npm start

# Frontend: Unit/Integration Tests
npm test
```

### E2E Tests (Playwright)

All Playwright test code, configuration, and dependencies are now fully isolated in `tests-e2e/`.
- **Locally:** All browsers (Chromium, Firefox, WebKit) are tested in parallel (default 5 workers).
- **CI:** Only Chromium is run, with tests executed sequentially (1 worker).

```bash
cd tests-e2e
npm ci
npx playwright test                 # Run all tests (across Chromium, Firefox, WebKit *locally*, Chromium *in CI*)
npx playwright test --grep "@smoke" # Only smoke tests
npx playwright test --grep "@regression" # Only regression tests
npx playwright show-report          # Open the HTML report
```

You can also run a single test file or case:
```bash
npx playwright test tests/todo-crud-user.spec.ts
npx playwright test -g "should add, edit, and delete todos"
```

---

## 📊 Playwright E2E Features

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

## 🤝 Contributing

PRs and suggestions are welcome! Please open issues or submit pull requests. Run the full test suite, including E2E, before submitting for review.

---

## 📄 License

MIT
