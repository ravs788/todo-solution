# Application Flow Diagram

This diagram illustrates the flow between the layers of the Todo application, from the UI through the backend to MSSQL.

---

## User & Admin Flows

### Registration, Approval, Login, and Password Reset

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant A as Admin

    %% Registration and Approval Flow
    U->>F: Fill registration form
    F->>B: POST /api/auth/register (username, password)
    B->>B: Create user (status: PENDING)
    B->>F: "Registered, pending approval"
    F->>U: Show "Pending approval" message

    alt Admin Approval Needed
        A->>F: Login as admin
        F->>B: POST /api/auth/login (admin creds)
        B->>F: admin JWT/token issued
        A->>F: Open Admin Panel
        F->>B: GET /api/admin/pending-users (JWT)
        B->>F: [list of PENDING users]
        A->>F: Click approve
        F->>B: POST /api/admin/approve-user/{id}
        B->>B: Set user status to ACTIVE
        B->>F: OK
        F->>A: "User approved"
    end

    %% User login after approval
    U->>F: Login
    F->>B: POST /api/auth/login (username, password)
    B->>B: Check status is ACTIVE
    B->>F: JWT/token issued for user
    F->>U: Access granted

    %% Password Reset Flow (no token)
    U->>F: Fill Forgot Password (username, newPassword)
    F->>B: POST /api/auth/forgot-password (username, newPassword)
    B->>B: Update password directly if user exists
    B->>F: Success
    F->>U: Redirect to login, show "Password has been reset"
```

### Notes

- **SQL Server required** for backend in all environments.
- Default admin user created if not present in MSSQL DB.
- Normal users must be approved by admin before login.
- After password reset, redirect to login and show "Password has been reset" message.

### Admin Panel and Auth Endpoints

- **/api/auth/register**: New user registered as "PENDING"
- **/api/admin/pending-users**: Admin gets list of pending users
- **/api/admin/approve-user/{id}**: Admin approves user ("ACTIVE")
- **/api/auth/login**: User or admin login (status must be ACTIVE)
- **/api/auth/forgot-password**: User directly resets password (username & newPassword; no email/token required)

---

## UML Class Diagram

```mermaid
classDiagram
    class AuthController {
      +login()
      +register()
      +forgotPassword()
      +resetPassword()
    }
    class AdminController {
      +approveUser()
      +getPendingUsers()
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
    AdminController --> UserRepository
    AdminController --> User
    TodoController --> TodoService
    TodoService --> TodoRepository
    TodoRepository --> Todo
    TodoController --> Todo
    UserRepository --> User

    %% Extra relationships for admin and password reset flows
    class ForgotPasswordRequest
    class ResetPasswordRequest
    AuthController ..> ForgotPasswordRequest
    AuthController ..> ResetPasswordRequest
```

---

> **Note:**
> - Password reset is direct: users reset their password on the Forgot Password page by providing their username and new password, with no token or email involved.
> - After successful reset, users are redirected to the login page and see a "Password has been reset" message.
> - All admin/user control flows (including approval and pending user list) are accessible from the Admin Panel in the UI.

---

## Testing & CI/CD

- **Unit** and **integration tests** are present and require an accessible SQL Server.
- **All GitHub Actions pipelines are currently commented out** - see `.github/workflows/`.

---

For detailed API usage and environment setup, see `README.md` (now fully up-to-date with these flows).
