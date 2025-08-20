import { Page, Locator } from '@playwright/test';

/**
 * Page Object for password reset ("Forgot Password" flow).
 * Adjust selectors and field names/ids/placeholders as needed for your app.
 */
export class ResetPasswordPage {
  readonly page: Page;
  readonly baseUrl: string;
  readonly usernameInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly backToLoginButton: Locator;
  readonly logoImg: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.usernameInput = page.getByPlaceholder('Enter your username');
    this.newPasswordInput = page.getByPlaceholder('Type your new password');
    this.confirmPasswordInput = page.getByPlaceholder('Repeat new password');
    this.submitButton = page.getByRole('button', { name: 'Reset Password' });
    this.backToLoginButton = page.getByRole('button', { name: /back to login/i });
    this.logoImg = page.getByAltText('Logo');
  }

  async goto() {
    // Update the reset password/forgot password route here if needed:
    // Examples: '/reset-password', '/forgot-password', '/auth/reset', etc.
    await this.page.goto(this.baseUrl + '/forgot-password');
    await this.page.waitForLoadState('networkidle');
    // Verify reset form actually loaded
    await this.usernameInput.waitFor({ state: 'visible', timeout: 5000 });
  }

  async resetPassword(username: string, newPassword: string, confirmPassword: string) {
    await this.usernameInput.fill(username);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
    // Wait for login page to be loaded as the synchronization point after successful reset
    const loginPage = new (await import('./LoginPage')).LoginPage(this.page, this.baseUrl);
    await loginPage.expectLoaded();
  }

  async backToLogin() {
    await this.backToLoginButton.click();
  }
}
