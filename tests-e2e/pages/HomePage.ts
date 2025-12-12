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
  readonly navBar: Locator;
  readonly navUndoButton: Locator;
  readonly navRedoButton: Locator;

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
    // Navbar undo/redo button locators
    this.navBar = page.locator('nav, [role="navigation"]').first();
    this.navUndoButton = this.navBar.getByRole('button', { name: /undo/i }).first();
    this.navRedoButton = this.navBar.getByRole('button', { name: /redo/i }).first();
  }

  /**
   * Clicks the Undo button from the navbar.
   */
  async clickNavbarUndo() {
    await this.navUndoButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.navUndoButton.click();
  }

  /**
   * Clicks the Redo button from the navbar.
   */
  async clickNavbarRedo() {
    await this.navRedoButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.navRedoButton.click();
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
   * Returns the first row in the todo table where the title exactly matches the given title.
   */
  getTodoRowByTitle(title: string): Locator {
    // Uses .nth(0) to resolve to a single locator, even if more than one exists.
    return this.todoTable.locator(`tbody tr td:first-child`, { hasText: title }).first().locator('..');
  }

  /**
   * Clicks the Delete button for the todo with the given title in the table.
   */
  async deleteTodoByTitle(title: string) {
    const row = this.getTodoRowByTitle(title);
    const deleteBtn = row.locator('button.btn-danger, button[aria-label*=Delete], button:has-text("Delete")').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
    await deleteBtn.click();
  }

  /**
   * Waits for all toast notifications with role="region" and aria-label="Toast notifications" to be hidden.
   */
  async waitForNoToast(timeout: number = 15000) {
    const toastRegion = this.page.locator('[role="region"][aria-label="Toast notifications"]');
    // Wait until the toast region is not visible or has pointer-events:none
    const start = Date.now();
    while ((await toastRegion.isVisible()) && (Date.now() - start < timeout)) {
      await this.page.waitForTimeout(300);
      // Extra check for pointer-events: none or opacity: 0 (could be animated out)
      const pointerEvents = await toastRegion.evaluate(
        el => getComputedStyle(el).pointerEvents
      ).catch(() => 'auto');
      if (pointerEvents === 'none') break;
    }
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
    // If page/context already closed, nothing to do (mobile runs can close between steps)
    try {
      if (this.page.isClosed()) {
        return;
      }
    } catch {
      // If any error determining state, bail out safely
      return;
    }
    // Attempt to click a visible logout control if present (desktop/tablet)
    const logoutButton = this.page.locator('button, a', { hasText: /logout/i }).first();
    let canSeeLogout = false;
    try {
      canSeeLogout = await logoutButton.isVisible();
    } catch {
      canSeeLogout = false;
    }
    if (canSeeLogout) {
      try {
        await logoutButton.click({ trial: true });
        await logoutButton.click();
      } catch {
        try {
          await logoutButton.click({ force: true });
        } catch {
          // ignore if page/context closed or still not clickable
        }
      }
    }

    // Guard again in case click action caused page/context to close
    try {
      if (this.page.isClosed()) {
        return;
      }
    } catch {
      return;
    }
    // Ensure auth state is cleared (robust for mobile where UI chrome may differ)
    try {
      await this.page.evaluate(() => {
        try { localStorage.removeItem('jwtToken'); } catch {}
        try { sessionStorage.clear(); } catch {}
      });
    } catch {}

    const loginUrl = this.baseUrl + '/login';

    // Try normal navigation first
    try {
      await this.page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    } catch {
      // ignore and try a hard redirect below
    }

    // Ensure URL is on /login; if not, force it via window.location to bypass SPA/router quirks
    try {
      await this.page.waitForURL('**/login*', { timeout: 5000 });
    } catch {
      try {
        await this.page.evaluate((href) => { try { window.location.assign(href); } catch {} }, loginUrl);
        await this.page.waitForLoadState('domcontentloaded', { timeout: 8000 });
        await this.page.waitForURL('**/login*', { timeout: 5000 }).catch(() => {});
      } catch {}
    }

    // Wait for either the username input or the Login button to be interactable; reload as a last resort
    const username = this.page.locator('#login-username');
    const loginBtn = this.page.getByRole('button', { name: 'Login' });

    try {
      await username.waitFor({ state: 'visible', timeout: 12000 });
    } catch {
      try {
        await loginBtn.waitFor({ state: 'visible', timeout: 6000 });
      } catch {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.race([
          username.waitFor({ state: 'visible', timeout: 8000 }),
          loginBtn.waitFor({ state: 'visible', timeout: 8000 })
        ]);
      }
    }
  }
}
