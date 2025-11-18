import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { CreateTodoPage } from "../pages/CreateTodoPage";
import { UpdateTodoPage } from "../pages/UpdateTodoPage";
import { HomePage } from "../pages/HomePage";
import config from "../../config.json";
import todoOpsData from "../test-data/todo-other-operations.json";

const testUser = todoOpsData.users[0];

test.beforeEach(async ({ page }) => {
  await page.goto(config.baseUrl);

  // Login as existing user from test data
  const loginPage = new LoginPage(page, config.baseUrl);
  await loginPage.goto();
  await loginPage.login(testUser.username, testUser.password);
});

test.describe("Todo Other Operations", () => {
  test("should allow me to mark todo items as completed @regression", async ({
    page,
  }) => {
    // Create a new unique todo
    const todoTitle = "Complete me Test Todo " + Date.now();
    const createTodoPage = new CreateTodoPage(page, config.baseUrl);
    await createTodoPage.goto();
    await createTodoPage.createTodo(
      todoTitle,
      "definite",
      false,
      new Date().toISOString().slice(0, 16)
    );
    await page.waitForTimeout(700);

    // Mark as completed with update page abstraction
    const updateTodoPage = new UpdateTodoPage(page, config.baseUrl);
    await updateTodoPage.goto();
    await updateTodoPage.completeTodo(todoTitle);

    // Optionally, re-confirm directly
    const homePage = new HomePage(page, config.baseUrl);
    await homePage.goto();
    await homePage.setTitleFilter(todoTitle);
    const row = homePage.todoTable.locator("tbody tr").filter({
      has: page.locator("td").first().filter({ hasText: todoTitle }),
    });
    const completedCell = row.locator("td").nth(1);
    await completedCell.waitFor({ state: "visible", timeout: 3000 });
    await expect(await completedCell.innerText()).toMatch(/yes/i);
  });

  test("should allow me to create a Regular Activity todo @regression", async ({
    page,
  }) => {
    // Create a Regular Activity todo
    const todoTitle = "Regular Activity Todo " + Date.now();
    const createTodoPage = new CreateTodoPage(page, config.baseUrl);
    await createTodoPage.goto();
    await createTodoPage.createTodo(
      todoTitle,
      "regular",
      false,
      new Date().toISOString().slice(0, 16)
    );
    await page.waitForTimeout(700);

    // Verify it's shown in the todo table
    const homePage = new HomePage(page, config.baseUrl);
    await homePage.goto();
    await homePage.setTitleFilter(todoTitle);
    const row = homePage.todoTable.locator("tbody tr").filter({
      has: page.locator("td").first().filter({ hasText: todoTitle }),
    });
    await expect(row).toBeVisible();
  });
});

// Ensure we always logout at end of each test
test.afterEach(async ({ page }) => {
  const homePage = new HomePage(page, config.baseUrl);
  // Set a reasonable timeout for logout to avoid hanging the test suite
  const logoutPromise = homePage.logout();
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Logout timeout')), 20000)
  );

  try {
    await Promise.race([logoutPromise, timeoutPromise]);
  } catch (error) {
    console.warn('Logout failed or timed out, continuing test cleanup');
  }
});
