import { Page, Locator } from '@playwright/test';

/**
 * Page Object for deleting a todo item.
 * Update selectors and navigation as needed to match your app.
 */

export class DeleteTodoPage {
  readonly page: Page;
  readonly baseUrl: string;
  readonly tableRowWithTitle: (title: string) => Locator;
  readonly deleteLinkInRow: (row: Locator) => Locator;
  readonly confirmHeading: Locator;
  readonly confirmYesButton: Locator;
  readonly confirmCancelButton: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.tableRowWithTitle = (title: string) => {
      const displayTitle = title && title.length > 40 ? title.slice(0, 40) : title;
      return this.page.locator('table.custom-table tbody tr').filter({
        has: this.page.locator('td').first().filter({ hasText: displayTitle })
      });
    };
    this.deleteLinkInRow = (row: Locator) => row.locator('a.btn.btn-danger');
    this.confirmHeading = page.getByRole('heading', { name: /confirm deletion/i });
    this.confirmYesButton = page.getByRole('button', { name: /yes, delete/i });
    this.confirmCancelButton = page.getByRole('button', { name: /cancel/i });
  }

  // Navigate to todo listing
  async goto() {
    await this.page.goto(this.baseUrl + '/');
    // Use a lighter wait to avoid hanging on dev server websockets
    await this.page.waitForLoadState('domcontentloaded');
    // App-level heading confirms the page is ready for interactions
    await this.page.getByRole('heading', { name: 'Todo List App' }).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Deletes the todo with the given title using robust selectors and wait logic.
   */
  async deleteTodo(title: string) {
    // Filter by the todo title before locating the row
    const filterInput = this.page.locator('input.form-control[placeholder="Filter by Title"]');
    await filterInput.fill(title || "");
    // Wait for the table to update (row appears)
    const row = this.tableRowWithTitle(title);
    await row.waitFor({ state: 'visible', timeout: 7000 });
    const deleteLink = this.deleteLinkInRow(row);
    await deleteLink.waitFor({ state: 'visible', timeout: 5000 });
    await deleteLink.scrollIntoViewIfNeeded();
    try {
      await deleteLink.click({ trial: true });
      await deleteLink.click();
    } catch (e1) {
      try {
        await deleteLink.click({ force: true });
      } catch (e2) {
        await this.page.evaluate((el) => (el as HTMLElement).click(), await deleteLink.elementHandle());
      }
    }
    // Confirm dialog
    await this.confirmHeading.waitFor({ state: 'visible', timeout: 3000 });
    await this.confirmYesButton.waitFor({ state: 'visible', timeout: 3000 });
    try {
      await this.confirmYesButton.click({ trial: true });
      await this.confirmYesButton.click();
    } catch {
      await this.confirmYesButton.click({ force: true });
    }
    // Wait for removal from table
    await this.page.getByText(title).waitFor({ state: 'hidden', timeout: 4000 });
  }
}
