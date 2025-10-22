import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Login page.
 * Update selectors and methods to match your app's login form structure.
 */
export class LoginPage {
  readonly page: Page;
  readonly baseUrl: string;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly logoImg: Locator;
  readonly registerButton: Locator;
  readonly forgotPasswordButton: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.usernameInput = page.locator('#login-username');
    this.passwordInput = page.locator('#login-password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.logoImg = page.getByAltText('Logo');
    this.registerButton = page.getByRole('button', { name: /register here/i });
    this.forgotPasswordButton = page.getByRole('button', { name: /forgot password/i });
  }

  async goto() {
    await this.page.goto(this.baseUrl + '/login');
    await this.page.waitForLoadState('networkidle');
    await this.expectLoaded();
  }

  async expectLoaded() {
    // Verify login landmark: login button visible
    await this.loginButton.waitFor({ state: 'visible', timeout: 5000 });
  }

  async login(username: string, password: string): Promise<boolean> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    try {
      // Wait for success (redirect to dashboard)
      await this.page.getByRole('heading', { name: 'Todo List App' }).waitFor({ state: 'visible', timeout: 10000 });
      return true; // Login successful
    } catch {
      // If success doesn't happen within timeout, check if we're still on login page
      try {
        await this.loginButton.waitFor({ state: 'visible', timeout: 2000 });
        return false; // Still on login page, login failed
      } catch {
        // If login button is not visible, something unexpected happened
        throw new Error('Login failed: Unexpected page state');
      }
    }
  }

  async clickRegister() {
    await this.registerButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordButton.click();
  }
}
