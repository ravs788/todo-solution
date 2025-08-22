import { test, expect } from '@playwright/test';
import usersData from '../test-data/users-todo-actions.json';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
// If there is a TodoPage, import it; otherwise, we'll work with home page selectors

// Helper to add a todo using page object model matching the new UI
import { CreateTodoPage } from '../pages/CreateTodoPage';
async function addTodo(
  page,
  baseURL,
  {
    title,
    activityType = 'definite' as 'definite' | 'regular',
    completed = false,
    startDate = new Date().toISOString().slice(0, 16)
  }: { title: string; activityType?: 'definite' | 'regular'; completed?: boolean; startDate?: string }
) {
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const uniqueTitle = `${title} [${randomSuffix}]`;
  const createTodoPage = new CreateTodoPage(page, baseURL);
  await createTodoPage.goto();
  await createTodoPage.createTodo(
    uniqueTitle,
    activityType,
    completed,
    startDate
  );
  // After creation, go to the home (todo list) page and check for the todo
  await page.goto(baseURL + "/");
  const homeHeader = page.locator('h2.mb-4', { hasText: 'Todo List' });
  await homeHeader.waitFor({ state: 'visible', timeout: 4000 });
  await homeHeader.waitFor({ state: 'visible', timeout: 5000 });
  // Filter by uniqueTitle before checking for visibility
  const filterInput = page.locator('input.form-control[placeholder="Filter by Title"]');
  await filterInput.fill(uniqueTitle);
  // Wait for at least one row to appear in the todo table
  const row = page.locator('table.table-striped tbody tr').filter({
    has: page.locator('td').first().filter({ hasText: uniqueTitle }),
  });
  await row.waitFor({ state: 'visible', timeout: 7000 });
  await expect(page.getByText(uniqueTitle)).toBeVisible();
  return uniqueTitle;
}

import { UpdateTodoPage } from '../pages/UpdateTodoPage';
import { DeleteTodoPage } from '../pages/DeleteTodoPage';
import config from '../../config.json';

for (const user of usersData) {
  test.describe(`Todo CRUD operations`, () => {
    test(`should add, edit, and delete todos`, async ({ page }) => {
      const loginPage = new LoginPage(page, config.baseUrl);
      const homePage = new HomePage(page, config.baseUrl);

      // Login as user
      await loginPage.goto();
      await loginPage.login(user.username, user.password);

      // Add todos using the new CreateTodoPage fields
      // Map to store mapping from original title -> uniqueTitle so we can refer in edit phase
      const uniqueTitles: Record<string, string> = {};

      for (const todo of user.add) {
        const uniqueTitle = await addTodo(page, config.baseUrl, { title: todo.title });
        uniqueTitles[todo.title] = uniqueTitle;
        
        // Log all row titles as seen in the UI
        const rowTitles = await page.$$eval(
          'table.table-striped tbody tr td:first-child',
          tds => tds.map(td => (td as HTMLElement).innerText)
        );        
      }

      // Edit all added todos: rename by appending " (edited)"
      for (const orig in uniqueTitles) {
        const updateTodoPage = new UpdateTodoPage(page, config.baseUrl);
        await updateTodoPage.goto();
        const newTitle = uniqueTitles[orig] + ' (edited)';
        await updateTodoPage.editTodo(uniqueTitles[orig], newTitle);
        // Track the new title for the delete phase
        uniqueTitles[orig] = newTitle;
        await page.waitForTimeout(800);
        await expect(page.getByText(newTitle)).toBeVisible();
      }

      // Delete all edited todos
      for (const orig in uniqueTitles) {
        const deleteTodoPage = new DeleteTodoPage(page, config.baseUrl);
        await deleteTodoPage.goto();
        await deleteTodoPage.deleteTodo(uniqueTitles[orig]);
      }

    });
  });
}
