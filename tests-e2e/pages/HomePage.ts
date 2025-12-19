import { Page, Locator, expect } from '@playwright/test';

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
   * Waits for button to be both visible and enabled.
   */
  async clickNavbarUndo() {
    await this.navUndoButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.navUndoButton.waitFor({ state: 'attached', timeout: 5000 });
    await expect(this.navUndoButton).toBeEnabled({ timeout: 5000 });
    await this.navUndoButton.click();

    // After undo, close "todo deletion undone" toast if visible
    const toastAlert = this.page.locator('[role="region"][aria-label="Toast notifications"] [role="alert"]');
    // Wait up to 2s for matching alert toast to appear with 'undone' text
    if (await toastAlert.filter({ hasText: 'undone' }).waitFor({ state: "visible", timeout: 2000 }).catch(() => false)) {
      // Highlight for debug
      await toastAlert.evaluate(el => {
        el.style.outline = "4px solid magenta";
        el.style.background = "#fdffe6";
        el.style.boxShadow = "0 0 18px 6px #ff25eb";
        el.scrollIntoView({ block: "center", inline: "center" });
      }).catch(() => {});
      await this.page.waitForTimeout(500);

      const closeBtn = toastAlert.locator('button[aria-label*="close"], button[aria-label*="Close"]').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.waitFor({ state: "attached", timeout: 1500 }).catch(() => {});
        await closeBtn.waitFor({ state: "visible", timeout: 1500 }).catch(() => {});
        // Wait for enabled
        for (let t = 0; t < 10; t++) {
          if (await closeBtn.isEnabled().catch(() => false)) break;
          await this.page.waitForTimeout(100);
        }
        await closeBtn.click({ timeout: 2000 }).catch(() => {});
        await this.page.waitForTimeout(300);
      }
    }
  }

  /**
   * Clicks the Redo button from the navbar.
   * Waits for button to be both visible and enabled.
   */
  async clickNavbarRedo() {
    await this.navRedoButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.navRedoButton.waitFor({ state: 'attached', timeout: 5000 });
    await expect(this.navRedoButton).toBeEnabled({ timeout: 5000 });

    // Ensure any toast alert is hidden before clicking Redo
    await this.page.locator('[role="region"][aria-label="Toast notifications"] [role="alert"]').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    // Small buffer to guarantee removal
    await this.page.waitForTimeout(500);
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
    // More robust: tr that has a td with exact text
    return this.todoTable.locator(`tbody tr`, { has: this.page.locator(`td:first-child`, { hasText: title }) }).first();
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
      // Try to forcibly close a toast alert if present and visible
      const toastAlert = this.page.locator('[role="region"][aria-label="Toast notifications"] [role="alert"]');
      if (await toastAlert.isVisible().catch(() => false)) {
        await toastAlert.evaluate(el => {
          el.style.outline = "4px solid orange";
          el.style.background = "#fff8cf";
          el.scrollIntoView({ block: "center", inline: "center" });
        }).catch(() => {});
        const closeBtn = toastAlert.locator('button[aria-label*="close"], button[aria-label*="Close"]').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.waitFor({ state: "attached", timeout: 1500 }).catch(() => {});
          await closeBtn.waitFor({ state: "visible", timeout: 1500 }).catch(() => {});
          // Wait for enabled
          for (let t = 0; t < 10; t++) {
            if (await closeBtn.isEnabled().catch(() => false)) break;
            await this.page.waitForTimeout(100);
          }
          await closeBtn.click({ timeout: 2000 }).catch(() => {});
          await this.page.waitForTimeout(150);
        }
      }

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
    // Attempt to click a visible logout control if present (universal)
    const logoutButton = this.page.getByRole('button', { name: /logout/i });
    let canSeeLogout = false;
    try {
      canSeeLogout = await logoutButton.isVisible();
    } catch {
      canSeeLogout = false;
    }
    if (canSeeLogout) {
      try {
        await logoutButton.scrollIntoViewIfNeeded();
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
