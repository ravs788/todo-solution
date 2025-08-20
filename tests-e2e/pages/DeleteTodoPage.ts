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
    this.tableRowWithTitle = (title: string) =>
      this.page.locator('table.table-striped tbody tr').filter({
        has: this.page.locator('td').first().filter({ hasText: title })
      });
    this.deleteLinkInRow = (row: Locator) => row.locator('a.btn.btn-danger');
    this.confirmHeading = page.getByRole('heading', { name: /confirm deletion/i });
    this.confirmYesButton = page.getByRole('button', { name: /yes, delete/i });
    this.confirmCancelButton = page.getByRole('button', { name: /cancel/i });
  }

  // Navigate to todo listing
  async goto() {
    await this.page.goto(this.baseUrl + '/');
    await this.page.waitForLoadState('networkidle');
    await this.page.getByRole('heading', { name: 'Todo List App' }).waitFor({ state: 'visible', timeout: 5000 });
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
    await deleteLink.click();
    // Confirm dialog
    await this.confirmHeading.waitFor({ state: 'visible', timeout: 3000 });
    await this.confirmYesButton.waitFor({ state: 'visible', timeout: 3000 });
    await this.confirmYesButton.click();
    // Wait for removal from table
    await this.page.getByText(title).waitFor({ state: 'hidden', timeout: 4000 });
  }
}
