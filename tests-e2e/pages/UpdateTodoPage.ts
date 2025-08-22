import { Page, Locator } from '@playwright/test';

/**
 * Page Object for updating a todo item.
 * Update selectors and navigation as per your app. 
 * If editing is inline (not on a separate page), adapt methods accordingly.
 */
export class UpdateTodoPage {
  readonly page: Page;
  readonly baseUrl: string;
  readonly heading: Locator;
  readonly titleInput: Locator;
  readonly activityTypeSelect: Locator;
  readonly activityTypeOptionDefinite: Locator;
  readonly activityTypeOptionRegular: Locator;
  readonly completedCheckbox: Locator;
  readonly startDateInput: Locator;
  readonly updateButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.heading = page.getByRole('heading', { name: /update todo/i });
    this.titleInput = page.locator('input[type="text"]');
    this.activityTypeSelect = page.locator('select');
    this.activityTypeOptionDefinite = page.locator('option[value="definite"]');
    this.activityTypeOptionRegular = page.locator('option[value="regular"]');
    this.completedCheckbox = page.locator('#completedUpdateInput');
    this.startDateInput = page.locator('input[type="datetime-local"]');
    this.updateButton = page.getByRole('button', { name: /update todo/i });
    this.backButton = page.getByRole('button', { name: /back/i });
  }

  // Navigates to home (listing), not to update 
  async goto() {
    await this.page.goto(this.baseUrl + '/');
    await this.page.waitForLoadState('networkidle');
    await this.page.getByRole('heading', { name: 'Todo List App' }).waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Edits the todo with given parameters.
   * @deprecated prefer editTodoFromModel for strong typing
   */
  async editTodo(
    oldTitle: string,
    newTitle: string,
    { activityType, completed, startDate }: { activityType?: 'definite' | 'regular'; completed?: boolean; startDate?: string } = {}
  ) {
    await this.editTodoFromModel({
      id: -1, // Not used by UI flow
      title: newTitle,
      activityType,
      completed,
      startDate,
      // The UI lookup remains by oldTitle, see below
      _uiOldTitle: oldTitle
    } as any);
  }

  /**
   * Edits a todo using an UpdateTodoRequest model.
   * If _uiOldTitle is provided (for UI lookup), uses it to find the todo row.
   * Disregards model.id unless directly used by UI.
   */
  async editTodoFromModel(req: import('../models/UpdateTodoRequest').UpdateTodoRequest & { _uiOldTitle?: string }) {
    // Use _uiOldTitle for UI lookup; fallback to req.title.
    const originalTitle = req._uiOldTitle || req.title;
    // Filter by the todo title before locating the row
    const filterInput = this.page.locator('input.form-control[placeholder="Filter by Title"]');
    await filterInput.fill(originalTitle || "");
    // Wait for the table to update (row appears)
    const row = this.page.locator('table.table-striped tbody tr').filter({
      has: this.page.locator('td').first().filter({ hasText: originalTitle }),
    });
    await row.waitFor({ state: 'visible', timeout: 7000 });
    const updateLink = row.locator('a.btn.btn-primary');
    await updateLink.waitFor({ state: 'visible', timeout: 5000 });
    await updateLink.click();

    // Wait for form
    await this.heading.waitFor({ state: 'visible', timeout: 5000 });

    // Edit fields if given
    await this.titleInput.waitFor({ state: 'visible', timeout: 3000 });
    if (req.title) {
      await this.titleInput.fill(req.title);
    }
    if (req.activityType) {
      await this.activityTypeSelect.selectOption(req.activityType);
    }
    if (typeof req.completed === 'boolean') {
      if ((await this.completedCheckbox.isChecked()) !== req.completed) {
        await this.completedCheckbox.click();
      }
    }
    if (req.startDate) {
      await this.startDateInput.fill(req.startDate);
    }

    // Submit (update)
    await this.updateButton.waitFor({ state: 'visible', timeout: 3000 });
    await this.updateButton.click();

    // Wait for the updated title to appear on home/list
    if (req.title) {
      // Filter by the updated title before checking visibility
      const filterInput = this.page.locator('input.form-control[placeholder="Filter by Title"]');
      await this.page.waitForLoadState('networkidle');
      await filterInput.fill(req.title);
      // Wait longer for slow environments and backend/db sync
      await this.page.getByText(req.title).waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  /**
   * Marks the given todo completed and verifies on list view.
   */
  async completeTodo(title: string) {
    // Filter by the todo title before locating the row
    const filterInput = this.page.locator('input.form-control[placeholder="Filter by Title"]');
    await filterInput.fill(title);
    // Find row and click update
    const row = this.page.locator('table.table-striped tbody tr').filter({
      has: this.page.locator('td').first().filter({ hasText: title }),
    });
    await row.waitFor({ state: 'visible', timeout: 7000 });
    const updateLink = row.locator('a.btn.btn-primary');
    await updateLink.waitFor({ state: 'visible', timeout: 5000 });
    await updateLink.click();

    // Wait for update landmark
    await this.heading.waitFor({ state: 'visible', timeout: 5000 });

    // Set completed = true
    await this.completedCheckbox.waitFor({ state: 'visible', timeout: 2000 });
    if (!(await this.completedCheckbox.isChecked())) {
      await this.completedCheckbox.click();
    }

    // Submit (update/save)
    await this.updateButton.waitFor({ state: 'visible', timeout: 2000 });
    await this.updateButton.click();

    // Filter by the todo title again after update
    await filterInput.fill(title);

    // Wait for the todo to appear with 'Yes' in Completed column (2nd cell)
    const updatedRow = this.page.locator('table.table-striped tbody tr').filter({
      has: this.page.locator('td').first().filter({ hasText: title }),
    });
    await updatedRow.waitFor({ state: 'visible', timeout: 5000 });
    const completedCell = updatedRow.locator('td').nth(1); // 2nd <td>
    await completedCell.waitFor({ state: 'visible', timeout: 3000 });
    const cellText = await completedCell.textContent();
    if (!cellText?.match(/yes/i)) {
      throw new Error(`Todo "${title}" not marked as completed in list (Completed cell value: "${cellText}")`);
    }
  }
}
