# Application Flow Diagram

This diagram illustrates the flow between the layers of the Todo application, from the UI through the backend to MSSQL.

---

## High-Level Flow

```mermaid
flowchart TD
User --> Login_Component
User --> Register_Component
User --> ForgotPassword_Component
User --> TodoList_Component
User --> TodoForm_Component
User --> TodoUpdate_Component
User --> TodoDelete_Component

Login_Component --> AuthContext
Register_Component --> AuthContext
ForgotPassword_Component --> AuthContext
TodoList_Component --> AuthContext
TodoForm_Component --> AuthContext
TodoUpdate_Component --> AuthContext
TodoDelete_Component --> AuthContext

AuthContext --> API_Request

API_Request --> AuthController
API_Request --> TodoController

AuthController --> UserRepository
TodoController --> TodoService
TodoService --> TodoRepository

UserRepository --> UserModel
TodoRepository --> TodoModel

UserModel --> MSSQL_Database
TodoModel --> MSSQL_Database

AuthController --> API_Response
TodoController --> API_Response
API_Response --> All_Components

MSSQL_Database["MSSQL Database (Required in all environments)"]
```

### Notes

- **SQL Server required** for backend in all environments.
- Default admin user created if not present in MSSQL DB.

### Admin Approval & Password Reset

- **/api/auth/register**: New user registered as "PENDING"
- **/api/auth/approve/{username}**: Admin approves user ("ACTIVE")
- **/api/auth/forgot-password**: Initiates password reset, returns token
- **/api/auth/reset-password**: Resets password using token

---

## UML Class Diagram

```mermaid
classDiagram
    class AuthController {
      +login()
      +register()
      +approveUser()
      +forgotPassword()
      +resetPassword()
    }
    class TodoController {
      +getTodos()
      +addTodo()
      +updateTodo()
      +deleteTodo()
    }
    class TodoService {
      +getTodos()
      +addTodo()
      +updateTodo()
      +deleteTodo()
    }
    class TodoRepository {
      +findAll()
      +save()
      +deleteById()
      +findById()
      +findAllByUsername()
      +findByIdAndUsername()
    }
    class UserRepository {
      +findByUsername()
      +save()
      +deleteById()
    }
    class Todo {
      -id
      -title
      -completed
      -startDate
      -username
    }
    class User {
      -id
      -username
      -password
      -role
      -status
    }

    AuthController --> UserRepository
    AuthController --> User
    TodoController --> TodoService
    TodoService --> TodoRepository
    TodoRepository --> Todo
    TodoController --> Todo
    UserRepository --> User

    %% Extra relationships for admin and password reset flows
    AuthController ..> "ForgotPasswordRequest"
    AuthController ..> "ResetPasswordRequest"
```

---

## Testing & CI/CD

- **Unit** and **integration tests** are present and require an accessible SQL Server.
- **All GitHub Actions pipelines are currently commented out** - see `.github/workflows/`.

---

For detailed API usage and environment setup, see `README.md`.
