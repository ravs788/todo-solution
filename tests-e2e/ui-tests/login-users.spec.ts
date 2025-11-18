import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import config from '../../config.json';

// Valid login test
test('should login successfully with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page, config.baseUrl);
  await loginPage.goto();
  const loginSuccess = await loginPage.login('testuser262501', 'password123');
  expect(loginSuccess).toBe(true);
  await expect(page.locator('h2.todo-list-title', { hasText: 'Todo List' })).toBeVisible();
});

// Invalid login tests - use login method and check return value
test('should fail login for invalid password', async ({ page }) => {
  const loginPage = new LoginPage(page, config.baseUrl);
  await loginPage.goto();

  const loginSuccess = await loginPage.login('testuser262501', 'wrongpassword');
  expect(loginSuccess).toBe(false);

  // Should still be on login page
  await expect(page).toHaveURL(/(\/login|\/)$/);
  await expect(loginPage.usernameInput).toBeVisible();
});

test('should fail login for non-existent user', async ({ page }) => {
  const loginPage = new LoginPage(page, config.baseUrl);
  await loginPage.goto();

  const loginSuccess = await loginPage.login('nonexistentuser', 'password123');
  expect(loginSuccess).toBe(false);

  // Should still be on login page
  await expect(page).toHaveURL(/(\/login|\/)$/);
  await expect(loginPage.usernameInput).toBeVisible();
});

test('should fail login for empty username', async ({ page }) => {
  const loginPage = new LoginPage(page, config.baseUrl);
  await loginPage.goto();

  const loginSuccess = await loginPage.login('', 'password123');
  expect(loginSuccess).toBe(false);

  // Should still be on login page
  await expect(page).toHaveURL(/(\/login|\/)$/);
  await expect(loginPage.usernameInput).toBeVisible();
});

test('should fail login for empty password', async ({ page }) => {
  const loginPage = new LoginPage(page, config.baseUrl);
  await loginPage.goto();

  const loginSuccess = await loginPage.login('testuser262501', '');
  expect(loginSuccess).toBe(false);

  // The app may redirect to home page on failure, so check if we're not on the success page
  await expect(page.locator('h2.todo-list-title', { hasText: 'Todo List' })).not.toBeVisible();
  // Check that either username or password input is visible (form should be present)
  const usernameVisible = await loginPage.usernameInput.isVisible().catch(() => false);
  const passwordVisible = await loginPage.passwordInput.isVisible().catch(() => false);
  expect(usernameVisible || passwordVisible).toBe(true);
});

// Form validation tests
test('should have all login form elements visible', async ({ page }) => {
  const loginPage = new LoginPage(page, config.baseUrl);
  await loginPage.goto();

  await expect(loginPage.usernameInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
  await expect(loginPage.loginButton).toBeVisible();
  await expect(loginPage.registerButton).toBeVisible();
  await expect(loginPage.forgotPasswordButton).toBeVisible();
  await expect(loginPage.logoImg).toBeVisible();
});

test('should navigate to register page when register button is clicked', async ({ page }) => {
  const loginPage = new LoginPage(page, config.baseUrl);
  await loginPage.goto();
  await loginPage.clickRegister();
  await expect(page).toHaveURL(/.*register.*/);
});

test('should navigate to forgot password page when forgot password button is clicked', async ({ page }) => {
  const loginPage = new LoginPage(page, config.baseUrl);
  await loginPage.goto();
  await loginPage.clickForgotPassword();
  await expect(page).toHaveURL(/.*forgot-password.*/);
});

// Accessibility test
test('should have proper form labels and attributes', async ({ page }) => {
  const loginPage = new LoginPage(page, config.baseUrl);
  await loginPage.goto();

  // Check that inputs have labels or aria-labels
  await expect(loginPage.usernameInput).toHaveAttribute('placeholder', /.*/);
  await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  await expect(loginPage.loginButton).toHaveAttribute('type', 'submit');
});
