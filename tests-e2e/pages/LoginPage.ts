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
    // Ensure we start logged out for every test to avoid cross-test state leakage
    await this.page.addInitScript(() => {
      try {
        const key = '__jwtCleared';
        if (!window.sessionStorage.getItem(key)) {
          window.localStorage.removeItem('jwtToken');
          window.sessionStorage.setItem(key, '1');
        }
      } catch {}
    });
    // Navigate to root path - the app shows login form for unauthenticated users
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState('networkidle');
    await this.expectLoaded();
  }

  async expectLoaded() {
    // Check if this is a mobile viewport
    const viewport = this.page.viewportSize();
    const isMobile = viewport && viewport.width <= 768;
    const timeout = isMobile ? 20000 : 10000;

    // Wait for React app to fully load and render
    await this.page.waitForTimeout(isMobile ? 3000 : 2000); // Give more time for React rendering on mobile

    // Wait for login form elements to be present in DOM
    await this.page.locator('#login-username').waitFor({ state: 'attached', timeout });
    await this.page.locator('button:has-text("Login")').waitFor({ state: 'attached', timeout });

    // Wait for elements to be visible
    await this.usernameInput.waitFor({ state: 'visible', timeout });
    await this.loginButton.waitFor({ state: 'visible', timeout });

    // Additional check for mobile - ensure elements are actually interactable
    const usernameVisible = await this.usernameInput.isVisible();
    const loginVisible = await this.loginButton.isVisible();

    if (!usernameVisible || !loginVisible) {
      throw new Error(`Login form elements not visible: username=${usernameVisible}, login=${loginVisible}`);
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    // Fast-path for HTML5 required validation cases: don't trigger submit if fields are empty
    if (!username || !password) {
      // Ensure we're on the root path and form is visible for unauthenticated users
      await this.page.goto(this.baseUrl);
      await this.expectLoaded();
      return false;
    }

    // Check if this is a mobile viewport (width <= 768)
    const viewport = this.page.viewportSize();
    const isMobile = viewport && viewport.width <= 768;

    if (isMobile) {
      // For mobile, try direct fill first with longer timeout
      try {
        await this.usernameInput.waitFor({ state: 'visible', timeout: 15000 });
        await this.usernameInput.fill(username, { timeout: 15000 });
        await this.passwordInput.fill(password, { timeout: 15000 });
      } catch (error) {
        // If direct fill fails, try click and type as fallback
        try {
          await this.usernameInput.click({ timeout: 5000 });
          await this.page.keyboard.type(username, { delay: 200 });
          await this.passwordInput.click({ timeout: 5000 });
          await this.page.keyboard.type(password, { delay: 200 });
        } catch (fallbackError) {
          throw new Error(`Failed to interact with login form on mobile: ${fallbackError}`);
        }
      }
    } else {
      // Desktop/tablet approach - try direct fill first
      try {
        await this.usernameInput.fill(username, { timeout: 10000 });
        await this.passwordInput.fill(password, { timeout: 10000 });
      } catch {
        // Fallback to click and type for older browsers or edge cases
        await this.usernameInput.click({ timeout: 5000 });
        await this.page.keyboard.type(username, { delay: 100 });
        await this.passwordInput.click({ timeout: 5000 });
        await this.page.keyboard.type(password, { delay: 100 });
      }
    }

    await this.loginButton.click();

    try {
      // Wait for success (redirect to dashboard)
      await this.page.getByRole('heading', { name: 'Todo List App' }).waitFor({ state: 'visible', timeout: 10000 });
      return true; // Login successful
    } catch {
      // If success doesn't happen within timeout, infer failure if we're still effectively on the login screen.
      const url = this.page.url();
      const onLoginRoute = /\/login\b/.test(url);
      const usernameVisible = await this.usernameInput.isVisible().catch(() => false);
      const loginVisible = await this.loginButton.isVisible().catch(() => false);
      const errorVisible = await this.page.getByText(/invalid username or password|login failed/i).isVisible().catch(() => false);
      if (onLoginRoute || usernameVisible || loginVisible || errorVisible) {
        return false; // Login failed but app remained on login context
      }
      // As a fallback, ensure we land on root path to keep test stable (login form shows for unauthenticated users)
      try {
        await this.page.goto(this.baseUrl);
        await this.expectLoaded();
        return false;
      } catch {
        // If navigation fails, treat as unexpected state
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
