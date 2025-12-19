import { test, expect } from '@playwright/test';
import config from '../../config.json';
import { LoginPage } from '../pages/LoginPage';
import { CreateTodoPage } from '../pages/CreateTodoPage';
/* Removed import: DeleteTodoPage */
import { HomePage } from '../pages/HomePage';
import { UndoRedoToastPage } from '../pages/UndoRedoToastPage';

test.describe('Undo/Redo E2E using Page Objects', () => {
  test.beforeEach(async ({ page }) => {
    // Set E2E test mode so toast is fully suppressed in frontend
    await page.addInitScript('window.__PLAYWRIGHT_TEST_MODE = true;');

    const loginPage = new LoginPage(page, config.baseUrl);
    await loginPage.goto();
    const loginSuccess = await loginPage.login('testuser262501', 'password123');
    expect(loginSuccess).toBe(true);
    // Ensure landing page loads
    const homePage = new HomePage(page, config.baseUrl);
    await homePage.goto();
    await expect(await homePage.isLoaded()).toBeTruthy();
  });

  test('create, delete, undo, redo basic happy path', async ({ page }) => {
    // Create a new todo
    const homePage = new HomePage(page, config.baseUrl);
    const undoRedoToastPage = new UndoRedoToastPage(page);
    await homePage.goto();
    await homePage.clickCreateNewTodo();
    const createTodoPage = new CreateTodoPage(page, config.baseUrl);
    await createTodoPage.goto();
    const title = `UndoX-${Date.now()}`;
    await createTodoPage.createTodo(title, 'definite', false, new Date().toISOString().slice(0, 16));

    // Ensure we are back on the home page and the table is loaded before proceeding.
    await homePage.header.waitFor({ state: 'visible', timeout: 10000 });
    await homePage.todoTable.waitFor({ state: 'visible', timeout: 10000 });

    // Filter for the just-created todo to ensure it is visible
    await homePage.setTitleFilter(title);

    // Wait for todo to appear before deleting
    await expect(homePage.getTodoRowByTitle(title)).toBeVisible();

    // Delete the todo
    // Delete via main table UI so Undo/Redo is enabled
    await homePage.deleteTodoByTitle(title);

    // Undo using navbar
    await homePage.waitForNoToast();
    await homePage.clickNavbarUndo();
    // Wait for and close the "deletion undone" toast before proceeding
    // await undoRedoToastPage.clickUndo();
    await expect(homePage.getTodoRowByTitle(title)).toBeVisible();

    // Redo using navbar
    // await homePage.waitForNoToast();
    await homePage.clickNavbarRedo();
    await expect(homePage.getTodoRowByTitle(title)).not.toBeVisible();
  });
});
