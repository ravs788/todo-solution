import { Page, Locator } from '@playwright/test';

/**
 * Page Object for user registration ("Sign up"/"Register" page).
 * Adjust selectors and field names/ids/placeholders as needed for your app.
 */
export class RegisterUserPage {
  readonly page: Page;
  readonly baseUrl: string;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly logoImg: Locator;
  readonly backToLoginButton: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.usernameInput = page.getByPlaceholder('Your username');
    this.passwordInput = page.getByPlaceholder('Choose password');
    this.confirmPasswordInput = page.getByPlaceholder('Repeat password');
    this.registerButton = page.getByRole('button', { name: 'Register' });
    this.logoImg = page.getByAltText('Logo');
    this.backToLoginButton = page.getByRole('button', { name: /back to login/i });
  }

  async goto() {
    await this.page.goto(this.baseUrl + '/register');
    await this.page.waitForLoadState('networkidle');
    await this.usernameInput.waitFor({ state: 'visible', timeout: 5000 });
  }

  async register(username: string, password: string, confirmPassword: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await Promise.all([
      this.registerButton.click(),
      // Wait for Back to login button as indication of registration completion/success
      this.backToLoginButton.waitFor({ state: 'visible', timeout: 5000 })
    ]);
  }

  async clickBackToLogin() {
    await this.backToLoginButton.click();
  }
}
