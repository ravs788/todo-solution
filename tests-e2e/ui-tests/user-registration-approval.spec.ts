import { test, expect } from '@playwright/test';
import { RegisterUserPage } from '../pages/RegisterUserPage';
import { LoginPage } from '../pages/LoginPage';
import { AdminPanelPage } from '../pages/AdminPanelPage';
import { HomePage } from '../pages/HomePage';
import testData from '../test-data/user-registration-approval.json';
import config from '../../config.json';

test('should register a new user, approve using admin, and login as the new user @smoke @regression', async ({ page }) => {
  const baseUrl = config.baseUrl;
  const randomSuffix = Math.floor(Math.random() * 1e6);
  const username = `testuser${randomSuffix}`;
  const password = testData.newUserPassword;

  // 1. Go to login page, then click through to register page and register a new user
  const loginPage = new LoginPage(page, baseUrl);
  await loginPage.goto();
  await loginPage.clickRegister();
  const registerPage = new RegisterUserPage(page, baseUrl);
  await registerPage.register(username, password, password);

  // Optionally, you can add a short hard wait after registering if backend propagation is slow
  // await page.waitForTimeout(1000);

  const homePage = new HomePage(page, baseUrl);

  // 2. Login as admin to approve the user
  await loginPage.login(testData.adminUsername, testData.adminPassword);
  await page.waitForLoadState('networkidle');
  

  // Go to admin panel and switch to "Pending Users"
  const adminPanel = new AdminPanelPage(page, baseUrl);
  await adminPanel.goto();
  await adminPanel.setView('PENDING');

  // Find the row for the new user and perform approval (if action is present)
  // Approve new user and validate move from pending to active state
  await adminPanel.approveUser(username);

  // Logout as admin
  await homePage.logout();
  await page.waitForLoadState('networkidle');

  // 3. Login as the new (now approved) user
  // If a "Login" button/link is available after logout, click it to get to login page again
  if (await page.getByRole('button', { name: /login/i }).isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.getByRole('button', { name: /login/i }).click();
  }
  await loginPage.login(username, password);
  await page.waitForLoadState('networkidle');

  // Validate successful login, e.g. landing on dashboard/home
  await expect(page.getByText(/todo list/i)).toBeVisible();
});
