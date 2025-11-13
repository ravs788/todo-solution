import { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Todo List page updated to match latest HTML.
 */
export class HomePage {
  readonly page: Page;
  readonly baseUrl: string;
  readonly header: Locator;
  readonly createNewTodoButton: Locator;
  readonly todoTable: Locator;
  readonly titleFilterInput: Locator;
  readonly statusFilterSelect: Locator;
  readonly pagerPrevButton: Locator;
  readonly pagerNextButton: Locator;
  readonly pagerInfo: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.header = page.locator('h2.mb-4', { hasText: 'Todo List' });
    this.createNewTodoButton = page.locator('a.btn.btn-primary.mb-3', { hasText: 'Create New Todo' });
    this.todoTable = page.locator('table.custom-table');
    this.titleFilterInput = page.locator('input.form-control[placeholder="Filter by Title"]');
    this.statusFilterSelect = page.locator('select.form-select');
    this.pagerPrevButton = page.locator('button.btn-outline-primary.btn-sm:has-text("Prev")');
    this.pagerNextButton = page.locator('button.btn-outline-primary.btn-sm:has-text("Next")');
    this.pagerInfo = page.locator('span', { hasText: 'Page' });
  }

  async goto() {
    await this.page.goto(this.baseUrl + '/');
    // Avoid hanging on dev server websockets on mobile; DOMContentLoaded is sufficient
    await this.page.waitForLoadState('domcontentloaded');
    await this.header.waitFor({ state: 'visible', timeout: 10000 });
    await this.todoTable.waitFor({ state: 'visible', timeout: 10000 });
  }

  async isLoaded(): Promise<boolean> {
    return this.header.isVisible();
  }

  async clickCreateNewTodo() {
    await this.createNewTodoButton.click();
  }

  async getTodoRows() {
    return this.todoTable.locator('tbody tr');
  }

  /**
   * Sets the Title filter to filter todos by title.
   * @param title The text to filter todo titles by.
   */
  async setTitleFilter(title: string) {
    await this.titleFilterInput.fill(title);
  }

  /**
   * Sets the Status filter to filter todos by completion status.
   * @param status "", "true", or "false"
   */
  async setStatusFilter(status: string) {
    await this.statusFilterSelect.selectOption({ value: status });
  }

  async clickPagerPrev() {
    await this.pagerPrevButton.click();
  }

  async clickPagerNext() {
    await this.pagerNextButton.click();
  }

  /**
   * Logs the user out by clicking the "Logout" button/link and waits for the login page to appear.
   * Assumes there is a logout element with text "Logout" on the home page.
   */
  async logout() {
    // Attempt to click a button or link with the text "Logout"
    const logoutButton = this.page.locator('button, a', { hasText: 'Logout' });
    await logoutButton.first().click();
    // Wait for login page indicator (e.g., the login form or button)
    await this.page.waitForSelector('text="Login"', { timeout: 5000 });
  }
}
