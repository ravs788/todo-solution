# Test Flow Diagram

```mermaid
flowchart TD
    subgraph Tests
        crud["todo-crud-user.spec.ts"]
        others["todo-other-operations.spec.ts"]
        reg["user-registration-approval.spec.ts"]
        login["login-users.spec.ts"]
        crudTag["@regression"]
        othersTag["@smoke"]
        regTag["@regression"]
        loginTag["@smoke"]
        crud --> crudTag
        others --> othersTag
        reg --> regTag
        login --> loginTag
    end

    subgraph Pages
        homePage["HomePage.ts"]
        createTodoPage["CreateTodoPage.ts"]
        updateTodoPage["UpdateTodoPage.ts"]
        deleteTodoPage["DeleteTodoPage.ts"]
        loginPage["LoginPage.ts"]
        registerUserPage["RegisterUserPage.ts"]
        adminPanelPage["AdminPanelPage.ts"]
    end

    subgraph Models
    User["User.ts"]
    end

    crud --> createTodoPage
    crud --> updateTodoPage
    crud --> deleteTodoPage
    others --> createTodoPage
    others --> updateTodoPage
    reg --> registerUserPage
    reg --> adminPanelPage
    login --> loginPage
    homePage --> User
```

**Diagram notes:**
- "CRUD," registration, and login spec files cover most front-end test flows (parametrized using test-data/).
- Tags in test titles allow `--grep` filtering (e.g., `@smoke`, `@regression`).
- All tests now run successfully across desktop, tablet, and mobile viewports.

## UML Class Diagram

```mermaid
classDiagram
    class TodoCrudUserSpec {
      tag: @regression
    }
    class TodoOtherOperationsSpec {
      tag: @smoke
    }
    class UserRegistrationApprovalSpec {
      tag: @regression
    }
    class LoginUsersSpec {
      tag: @smoke
    }
    class HomePage
    class CreateTodoPage
    class UpdateTodoPage
    class DeleteTodoPage
    class LoginPage
    class RegisterUserPage
    class AdminPanelPage
    class User

    TodoCrudUserSpec --> CreateTodoPage
    TodoCrudUserSpec --> UpdateTodoPage
    TodoCrudUserSpec --> DeleteTodoPage
    TodoOtherOperationsSpec --> CreateTodoPage
    TodoOtherOperationsSpec --> UpdateTodoPage
    UserRegistrationApprovalSpec --> RegisterUserPage
    UserRegistrationApprovalSpec --> AdminPanelPage
    LoginUsersSpec --> LoginPage
    HomePage --> User
```

**UML notes:**
- Each `Spec` class represents a test file and can use tags in titles for CI/test filtering.
- Arrow direction indicates main test-to-POM/model interactions.

_Both diagrams use Mermaid syntax, compatible with GitHub preview and VS Code extensions._
