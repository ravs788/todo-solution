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

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();

    // Wait for either success (dashboard heading) or failure (login error)
    const dashboardPromise = this.page.getByRole('heading', { name: 'Todo List App' }).waitFor({ state: 'visible', timeout: 15000 }).then(() => true, () => false);
    const errorPromise = this.page.locator('.error,.alert,[role="alert"]').waitFor({ state: 'visible', timeout: 15000 }).then(() => false, () => true);

    const result = await Promise.race([dashboardPromise, errorPromise]);
    if (!result) {
      // Try to surface error text for debugging
      let errorMsg = '';
      try {
        errorMsg = await this.page.locator('.error,.alert,[role="alert"]').innerText();
      } catch {}
      throw new Error('Login failed: ' + errorMsg);
    }
  }

  async clickRegister() {
    await this.registerButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordButton.click();
  }
}
