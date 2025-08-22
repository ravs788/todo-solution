import { test, expect } from '@playwright/test';
import usersData from '../test-data/login-users.json';
import { LoginPage } from '../pages/LoginPage';
import config from '../../config.json';

for (const user of usersData) {
  test(`should test login functionality`, async ({ page }) => {
    const loginPage = new LoginPage(page, config.baseUrl);
    await loginPage.goto();
    await loginPage.login(user.username, user.password);
    await expect(page.getByText(/todo list/i)).toBeVisible();
  });
}
