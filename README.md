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
[![CI (PRs & Merges)](https://github.com/ravs788/todo-solution/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ravs788/todo-solution/actions/workflows/ci.yml) [![Build Status](https://img.shields.io/badge/build-manual-inactive.svg)](../../actions) 

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
- **Playwright E2E** frontend tests
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
│   │   │       └── application.properties      # DB config (update for your environment)
│   │   └── test/
│   │       └── java/com/example/todobackend/
│   └── pom.xml
│
├── todo-frontend/           # React frontend (Node.js/npm)
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components (TodoList, etc)
│   │   ├── context/         # AuthContext, etc
│   │   ├── test/            # Frontend unit tests (Jest, RTL)
│   ├── package.json
│   └── .env                 # Set REACT_APP_API_URL as needed
│
├── allure-report/           # Test coverage reports (after running tests)
├── azure-deployment-plan.md # Azure deploy instructions
├── flow-diagram.md          # Architecture & flow diagrams
├── deployment-options-comparison.md
└── README.md                # This file

```

---

## 📝 Quickstart

### 1. Clone & configure

```bash
git clone <repo-url>
cd todo-solution/
# Configure backend DB in todo-backend/src/main/resources/application.properties
# Optionally edit frontend API URL in todo-frontend/.env
```

### 2. Start Backend (Java 17+, SQL Server required)

```bash
cd todo-backend
mvn spring-boot:run
```

- The app seeds a default admin user: **admin:password**
- User accounts require **admin approval** after registration.

### 3. Start Frontend

```bash
cd todo-frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Architecture & Key Flows

- See [flow-diagram.md](flow-diagram.md) for sequence/UML diagrams:
  - **Registration → admin approval → login → JWT**
  - **Direct password reset (no token)**
  - **Admin control panel for user management**

---

## ⚡ Main Scripts

### Backend

- `mvn spring-boot:run` - start server in dev mode
- `mvn test` - run all Java tests, tagged as unit/integration
- `mvn allure:serve` - launch Allure coverage UI

### Frontend

- `npm start` - start React dev server
- `npm test` - run frontend unit tests
- `npm run build` - production bundle
- `npm run e2e` - Playwright E2E tests (if configured)

---

## 🔒 Security / Auth

- All non-auth backend endpoints require a valid **JWT**.
- New users must be approved by admin before they can log in.
- Passwords can be directly reset (no email/token) via the UI.

---

## 🖥️ Scripts

Scripts are provided for starting the apps and running tests:

**Windows:** Use scripts in `bat-scripts/` (double-click or run with `cmd`)<br>
**Mac/Linux:** Use scripts in `sh-scripts/` (run with `bash sh-scripts/<script>.sh`)

| Script Name                      | What it does                        |
|-----------------------------------|-------------------------------------|
| run_backend.bat / .sh             | Starts the backend Spring Boot app  |
| run_frontend.bat / .sh            | Starts the React frontend dev server|
| run_backend_tests.bat / .sh       | Cleans and runs all backend tests   |
| run_frontend_tests.bat / .sh      | Cleans and runs all frontend tests  |
| run_all_tests.bat / .sh           | Runs both backend & frontend tests  |

> All scripts assume you run them from the project root.

---

<!-- 
## 🌐 Deployment

- Deployment scripts and automation are not yet implemented. Check back here for updates.
-->
## 📚 Further Reference

- [flow-diagram.md](flow-diagram.md): Sequence, class diagrams, and business logic
- [azure-deployment-plan.md](azure-deployment-plan.md): Azure production deployment instructions
- [deployment-options-comparison.md](deployment-options-comparison.md): Cloud and hosting options overview

---

## � Cline Rules and Automation

This project uses a reusable [CLINE_RULES.md](CLINE_RULES.md) file. These are automation rules for AI-based project helpers and scripts (e.g. Cline), designed to enforce workflow and code standards across all development and automation tasks.

**How it works:**
- Cline and anyone using project automation should always check and enforce the rules in CLINE_RULES.md before making changes, running chained shell commands, or pushing updates.
- See [flow-diagram.md](flow-diagram.md) for how rule enforcement fits into the project flow.

**Standard rules include:**
1. Always use semicolons (`;`) to chain shell commands, never `&&`.
2. Update all relevant documentation whenever code is pushed to GitHub, on any branch.
3. Keep this rules file updated, and consult both the README and flow diagram for integration and enforcement practices.

You may add more rules or update this doc as your automation process grows.

---

## �🤝 Contributing

PRs and suggestions are welcome! Please open issues or submit pull requests.

---

## 📄 License

MIT
