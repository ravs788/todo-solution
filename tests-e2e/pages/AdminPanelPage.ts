import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for the Admin Panel page (all users listing).
 * Auto-generated to align with the most recent design.
 */
export class AdminPanelPage {
  readonly page: Page;
  readonly baseUrl: string;
  readonly logoImg: Locator;
  readonly header: Locator;
  readonly usersTable: Locator;
  readonly tableRows: Locator;
  readonly viewSelect: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.logoImg = page.getByAltText('Logo');
    this.header = page.locator('h2', { hasText: 'Admin Panel – All Users' });
    this.usersTable = page.locator('table');
    this.tableRows = this.usersTable.locator('tbody tr');
    this.viewSelect = page.locator('select');
    this.prevButton = page.getByRole('button', { name: 'Prev' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
  }

  async goto() {
    await this.page.goto(this.baseUrl + '/admin');
    await this.page.waitForLoadState('networkidle');
    await this.header.waitFor({ state: 'visible', timeout: 5000 });
  }

  async setView(viewValue: "ACTIVE" | "PENDING") {
    // Wait for view select to be present
    await this.viewSelect.waitFor({ state: 'visible', timeout: 5000 });
    await this.viewSelect.selectOption(viewValue);
    await expect(this.viewSelect).toHaveValue(viewValue);
    // Give UI a moment to re-render table for the new view
    await this.page.waitForTimeout(1000);
  }

  async getUserRows() {
    return this.tableRows;
  }

  async getUserInfoAt(rowIdx: number) {
    const row = this.tableRows.nth(rowIdx);
    const username = await row.locator('td').nth(0).innerText();
    const status = await row.locator('td').nth(1).innerText();
    const action = await row.locator('td').nth(2).innerText();
    return { username, status, action };
  }

  /**
   * Finds a row by username across paginated results in the current view.
   * Returns the Locator for the row if found, otherwise null.
   */
  async findRowByUsernameAcrossPages(username: string): Promise<Locator | null> {
    // Build a safe and flexible pattern for the username
    const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const namePattern = new RegExp(`\\b${escaped}\\b`, 'i');

    // Always start from the first page for deterministic search
    const hasPrev = await this.prevButton.count();
    if (hasPrev > 0) {
      for (let i = 0; i < 30; i++) {
        if (await this.prevButton.isDisabled()) break;
        await this.prevButton.click();
        await this.page.waitForTimeout(150);
      }
    }

    // Search current page first
    let row = this.usersTable.locator('tbody tr').filter({
      has: this.page.locator('td').first().filter({ hasText: namePattern })
    }).first();
    if (await row.count()) {
      return row;
    }

    // Then paginate forward up to a reasonable limit
    const hasNext = await this.nextButton.count();
    if (hasNext > 0) {
      for (let i = 0; i < 30; i++) {
        if (await this.nextButton.isDisabled()) break;
        await this.nextButton.click();
        await this.page.waitForTimeout(250);

        row = this.usersTable.locator('tbody tr').filter({
          has: this.page.locator('td').first().filter({ hasText: namePattern })
        }).first();
        if (await row.count()) {
          return row;
        }
      }
    }

    return null;
  }

  /**
   * Approves a user in the PENDING view, checks their status in ACTIVE view.
   * Throws if user not found or not pending.
   */
  async approveUser(username: string): Promise<void> {
    await this.setView('PENDING');
    const userRows = await this.getUserRows();
    const rowCount = await userRows.count();
    let approved = false;
    for (let i = 0; i < rowCount; ++i) {
      const info = await this.getUserInfoAt(i);
      if (info.username === username) {
        if (/approve/i.test(info.action)) {
          const row = userRows.nth(i);
          await row.locator('button, [role="button"], [type="button"]', { hasText: /approve/i }).click();
          // Wait for status message to confirm UI processed approval (best-effort)
          try {
            await expect(this.page.getByText(/user approved/i)).toBeVisible({ timeout: 3000 });
          } catch {}
          // Switch to ACTIVE and re-query the row by username to avoid stale locator
          await this.setView('ACTIVE');
          // Retry a few times to allow pagination/table to refresh
          let activeRow: Locator | null = null;
          for (let attempt = 0; attempt < 12; attempt++) {
            activeRow = await this.findRowByUsernameAcrossPages(username);
            if (activeRow && (await activeRow.count())) break;
            await this.page.waitForTimeout(800);
          }
          if (!activeRow || !(await activeRow.count())) {
            // Fallback: hard refresh Admin Panel to reload users from backend, then retry
            await this.page.reload();
            await this.header.waitFor({ state: 'visible', timeout: 5000 });
            await this.setView('ACTIVE');
            for (let attempt = 0; attempt < 12; attempt++) {
              activeRow = await this.findRowByUsernameAcrossPages(username);
              if (activeRow && (await activeRow.count())) break;
              await this.page.waitForTimeout(800);
            }
            if (!activeRow || !(await activeRow.count())) {
              throw new Error(`Approved user "${username}" not found in ACTIVE list across pages`);
            }
          }
          await expect(activeRow.locator('td').nth(1)).toHaveText(/ACTIVE/i, { timeout: 5000 });
          approved = true;
          break;
        }
      }
    }
    if (!approved) {
      throw new Error(`User "${username}" not found in pending list or no approve action available`);
    }
    // Always switch dropdown to "Active Users" after approval
    await this.setView('ACTIVE');
    const activeRows = await this.getUserRows();
    const activeRowCount = await activeRows.count();
    let foundActive = false;
    for (let j = 0; j < activeRowCount; ++j) {
      const activeInfo = await this.getUserInfoAt(j);
      if (activeInfo.username === username) {
        expect(/active/i.test(activeInfo.status)).toBe(true);
        foundActive = true;
        break;
      }
    }
    if (!foundActive) {
      throw new Error(`Approved user "${username}" not found in ACTIVE list`);
    }
  }
}
