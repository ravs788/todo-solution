import { test, expect } from '@playwright/test';
import config from '../../config.json';
import { LoginPage } from '../pages/LoginPage';
import { CreateTodoPage } from '../pages/CreateTodoPage';
/* Removed import: DeleteTodoPage */
import { HomePage } from '../pages/HomePage';

test.describe('Undo/Redo E2E using Page Objects', () => {
  test.beforeEach(async ({ page }) => {
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
    await homePage.goto();
    await homePage.clickCreateNewTodo();
    const createTodoPage = new CreateTodoPage(page, config.baseUrl);
    await createTodoPage.goto();
    const title = 'UndoX';
    await createTodoPage.createTodo(title, 'definite', false, new Date().toISOString().slice(0, 16));

    // Delete the todo
    // Delete via main table UI so Undo/Redo is enabled
    await homePage.deleteTodoByTitle(title);

    // Undo using navbar
    await homePage.waitForNoToast();
    await homePage.clickNavbarUndo();
    await expect(homePage.getTodoRowByTitle(title)).toBeVisible();

    // Redo using navbar
    await homePage.waitForNoToast();
    await homePage.clickNavbarRedo();
    await expect(homePage.getTodoRowByTitle(title)).not.toBeVisible();
  });
});
