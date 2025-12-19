import { test, expect } from '@playwright/test';
import { RegisterUserPage } from '../pages/RegisterUserPage';
import { LoginPage } from '../pages/LoginPage';
import { AdminPanelPage } from '../pages/AdminPanelPage';
import { HomePage } from '../pages/HomePage';
import testData from '../test-data/user-registration-approval.json';
import config from '../../config.json';

test('should register a new user, approve using admin, and login as the new user @smoke @regression', async ({ page, browserName }) => {
  // Skip mobile viewports due to Playwright mobile interaction limitations
  const viewport = page.viewportSize();
  const isMobile = viewport ? viewport.width <= 768 : false;
  test.skip(isMobile, 'Skipping mobile viewport due to Playwright mobile interaction limitations');

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
  // For mobile, navigate directly to login page to avoid any logout UI issues
  if (isMobile) {
    await loginPage.goto();
    await page.waitForTimeout(2000); // Extra wait for mobile rendering
  } else {
    // If a "Login" button/link is available after logout, click it to get to login page again
    if (await page.getByRole('button', { name: /login/i }).isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.getByRole('button', { name: /login/i }).click();
    }
  }
  // Debug: Check what page we're on before login attempt
  console.log('Before login attempt - URL:', page.url());
  const loginSuccess = await loginPage.login(username, password);
  console.log('Login success result:', loginSuccess);
  console.log('After login attempt - URL:', page.url());

  // Wait for React app to fully load after login
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Give React time to initialize

  // Debug: Check what elements are visible on the page
  const todoListHeading = page.locator('h2.todo-list-title', { hasText: 'Todo List' });
  const loginForm = page.locator('#login-username');
  const errorMessage = page.locator('.alert-error');
  const pageTitle = page.locator('h1');
  const anyText = page.locator('body');

  console.log('Todo list heading visible:', await todoListHeading.isVisible().catch(() => false));
  console.log('Login form visible:', await loginForm.isVisible().catch(() => false));
  console.log('Error message visible:', await errorMessage.isVisible().catch(() => false));
  console.log('Page title text:', await pageTitle.textContent().catch(() => 'N/A') || 'N/A');
  console.log('Body text (first 200 chars):', ((await anyText.textContent().catch(() => '')) || '').substring(0, 200));

  expect(loginSuccess).toBe(true);

  // Validate successful login by checking if we're authenticated
  // The navigation should show logged-in state
  await expect(page.getByText('Home')).toBeVisible();
  await expect(page.getByText('Create Todo')).toBeVisible();
  await expect(page.getByText('Settings')).toBeVisible();
  await expect(page.getByText('Logout')).toBeVisible();

  // Navigate to home explicitly to ensure we're on the todo list page
  await page.goto(baseUrl + '/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Now check for the todo list heading
  await expect(page.locator('h2.todo-list-title', { hasText: 'Todo List' })).toBeVisible();
});
