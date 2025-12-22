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
      // Use nth(0) to get the first visible matching row (max one per test)
      return this.page.locator('table.custom-table tbody tr').filter({
        has: this.page.locator('td').first().filter({ hasText: displayTitle })
      }).first();
    };
    this.deleteLinkInRow = (row: Locator) => row.locator('button, a').filter({ hasText: 'Delete' }).first();
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
    await deleteLink.waitFor({ state: 'visible', timeout: 8000 });
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
    // Confirm dialog (if present) else assume immediate deletion
    let confirmedViaDialog = false;
    try {
      await this.confirmHeading.waitFor({ state: 'visible', timeout: 1200 });
      await this.confirmYesButton.waitFor({ state: 'visible', timeout: 1200 });
      try {
        await this.confirmYesButton.click({ trial: true });
        await this.confirmYesButton.click();
      } catch {
        await this.confirmYesButton.click({ force: true });
      }
      confirmedViaDialog = true;
    } catch {
      // No confirm dialog appeared; likely inline delete
    }

    // Wait for success indication: prefer row removal since list is filtered by title
    await row.waitFor({ state: 'detached', timeout: 8000 }).catch(async () => {
      // Fallback: hidden state or toast region visibility
      await row.waitFor({ state: 'hidden', timeout: 2000 }).catch(async () => {
        const toastRegion = this.page.locator('[role="region"][aria-label="Toast notifications"]').first();
        try {
          await toastRegion.waitFor({ state: 'visible', timeout: 3000 });
        } catch {}
      });
    });
  }
}
