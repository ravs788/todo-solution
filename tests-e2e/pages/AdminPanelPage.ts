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

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.logoImg = page.getByAltText('Logo');
    this.header = page.locator('h2', { hasText: 'Admin Panel – All Users' });
    this.usersTable = page.locator('table');
    this.tableRows = this.usersTable.locator('tbody tr');
    this.viewSelect = page.locator('select');
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
    // Wait for table to update (minimal wait)
    await this.page.waitForTimeout(500);
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
          await this.page.waitForTimeout(2000); // Small buffer to help UI catch up
          await this.setView('ACTIVE');
          await expect(row.locator('td').nth(1)).toHaveText(/ACTIVE/i, { timeout: 5000 });
          await this.page.waitForTimeout(200);
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
