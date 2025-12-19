import { test, expect } from '@playwright/test';
import usersData from '../test-data/users-todo-actions.json';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { LoginPage } from '../pages/LoginPage';
import config from '../../config.json';

for (const user of usersData) {
  test(`should reset password operation`, async ({ page }) => {
    const resetPage = new ResetPasswordPage(page, config.baseUrl);
    await resetPage.goto();
    await page.getByPlaceholder('Enter your username').waitFor({ state: 'visible', timeout: 5000 });
    await resetPage.resetPassword(user.username, user.password, user.password);

    const loginPage = new LoginPage(page, config.baseUrl);
    await loginPage.goto();
    await loginPage.login(user.username, user.password);
    await expect(page.locator('h2.todo-list-title', { hasText: 'Todo List' })).toBeVisible();
  });
}
