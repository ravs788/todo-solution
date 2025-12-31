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
  readonly reminderAtInput: Locator;
  /** Input box inside TagInput component used to enter tags */
  readonly tagInput: Locator;
  readonly updateButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.heading = page.getByRole('heading', { name: /update todo/i });
    this.titleInput = page.locator('input[type="text"]');
    this.activityTypeSelect = page.getByLabel('Activity Type');
    this.activityTypeOptionDefinite = page.locator('option[value="definite"]');
    this.activityTypeOptionRegular = page.locator('option[value="regular"]');
    this.completedCheckbox = page.locator('#completedUpdateInput');
    this.startDateInput = page.locator('input[type="datetime-local"][required]');
    this.reminderAtInput = page.locator('input[type="datetime-local"]:not([required])');
    this.tagInput = page.locator('input[aria-label="Tag input"]');
    // Robust selector to cover different renderings: class, type, and accessible name fallbacks
    this.updateButton = page.locator('button.todoupdate-btn-primary, button[type="submit"], input[type="submit"], button:has-text("Update"), button:has-text("Save")');
    this.backButton = page.getByRole('button', { name: /back/i });
  }

  // Navigates to home (listing), not to update 
  async goto() {
    await this.page.goto(this.baseUrl + '/');
    // Avoid hanging on dev server websockets; DOMContentLoaded is sufficient
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.getByRole('heading', { name: 'Todo List App' }).waitFor({ state: 'visible', timeout: 10000 });
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
  async editTodoFromModel(req: import('../models/UpdateTodoRequest').UpdateTodoRequest & { _uiOldTitle?: string, tags?: string[] }) {
    // Use _uiOldTitle for UI lookup; fallback to req.title.
    const originalTitle = req._uiOldTitle || req.title;
    const displayOriginal = originalTitle && originalTitle.length > 40 ? originalTitle.slice(0, 40) : originalTitle;
    // Filter by the todo title before locating the row
    let filterInput = this.page.locator('input.form-control[placeholder="Filter by Title"]');
    await filterInput.fill(originalTitle || "");
    // Ensure the filtering and table update is complete
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(300); // allow react table update tick
    // Wait for the table to update (row appears)
    const row = this.page.locator('table.custom-table tbody tr').filter({
      has: this.page.locator('td').first().filter({ hasText: displayOriginal }),
    });
    await row.waitFor({ state: 'visible', timeout: 7000 });
    const updateLink = row.locator('a.btn.btn-sm.btn-primary.me-2');
    await updateLink.waitFor({ state: 'visible', timeout: 5000 });
    await updateLink.scrollIntoViewIfNeeded();
    try {
      await updateLink.click({ trial: true });
      await updateLink.click();
    } catch (e1) {
      try {
        await updateLink.click({ force: true });
      } catch (e2) {
        const href = await updateLink.getAttribute('href');
        if (href) {
          await this.page.goto(this.baseUrl + href);
        } else {
          throw e2;
        }
      }
    }


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

    // Set tags before submitting if provided
    if (req.tags && Array.isArray(req.tags)) {
      await this.setTags(req.tags);
    }

    // Submit (update)
    await this.updateButton.waitFor({ state: 'visible', timeout: 3000 });
    // Same mobile bug workaround: blur all, collapse tag lists, scroll.
    await this.page.evaluate(() => {
      function blurAll() {
        const active = document.activeElement as HTMLElement;
        if (active && typeof active.blur === "function") active.blur();
        Array.from(document.querySelectorAll("input, textarea, select")).forEach((el: any) => {
          if (typeof el.blur === "function") el.blur();
        });
      }
      blurAll();
      // Special: blur date and tag input explicitly
      const tagInput = document.querySelector('input[aria-label="Tag input"]') as HTMLElement;
      if (tagInput && typeof tagInput.blur === "function") tagInput.blur();
      const dateInput = document.querySelector('input[type="datetime-local"]') as HTMLElement;
      if (dateInput && typeof dateInput.blur === "function") dateInput.blur();
      const tagList = document.querySelector('.taginput-tag-list');
      if (tagList) (tagList as HTMLElement).style.display = 'none';
    });

    await this.page.evaluate((btn) => {
      if (btn && typeof btn.scrollIntoView === "function") {
        btn.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
      }
    }, await this.updateButton.elementHandle());
    await this.page.waitForTimeout(700);
    // Extra robust scroll: ensure any scrollable ancestors bring the button into view
    await this.page.evaluate((btn) => {
      function scrollParents(el: HTMLElement | null) {
        let node = el ? el.parentElement : null;
        while (node) {
          const style = window.getComputedStyle(node);
          const overflowY = style.overflowY;
          const canScroll = (overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight;
          if (canScroll && el) {
            const rect = el.getBoundingClientRect();
            const containerRect = node.getBoundingClientRect();
            // Center the button within the scrollable container
            const offset = rect.top - containerRect.top - (containerRect.height / 2 - rect.height / 2);
            node.scrollTop += offset;
          }
          node = node.parentElement;
        }
      }
      if (btn) scrollParents(btn as HTMLElement);
    }, await this.updateButton.elementHandle());
    await this.page.waitForTimeout(200);

    const isOccluded = await this.page.evaluate((btn) => {
        if (!btn) return true; // If the button is null, treat as occluded/unavailable
        const rect = btn.getBoundingClientRect();
        const docEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return docEl !== btn;
    }, await this.updateButton.elementHandle());
    if (isOccluded) {
      throw new Error('Update button is occluded by another element after all scroll/blur attempts. Check floating UI, virtual keyboard, and overlays.');
    }

    await Promise.all([
      this.page.waitForURL('**/'),
      this.updateButton.click()
    ]);
    // Wait for fresh todos payload after navigation
    await this.page.waitForResponse(
      (resp) => resp.url().includes('/api/todos') && resp.request().method() === 'GET' && resp.status() >= 200 && resp.status() < 300,
      { timeout: 10000 }
    ).catch(() => {});
    // Ensure list view is present before proceeding to query controls (with fallback)
    try {
      await this.page.locator('h2.todo-list-title').waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      try {
        if (await this.backButton.isVisible().catch(() => false)) {
          await this.backButton.click();
        } else {
          await this.page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
        }
        await this.page.waitForURL('**/', { timeout: 10000 }).catch(() => {});
        await this.page.locator('h2.todo-list-title').waitFor({ state: 'visible', timeout: 10000 });
      } catch {
        if (!this.page.isClosed()) {
          await this.page.goto(this.baseUrl + '/');
          await this.page.locator('h2.todo-list-title').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        } else {
          return;
        }
      }
    }
    // Hard refresh to ensure latest data from backend before filtering
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await this.page.waitForLoadState('networkidle').catch(() => {});
    filterInput = this.page.locator('input.form-control[placeholder="Filter by Title"]');
    await filterInput.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for the updated title to appear on home/list
    if (req.title) {
      await filterInput.fill(req.title);
      const displayUpdated = req.title.length > 40 ? req.title.slice(0, 40) : req.title;
      // Wait longer for slow environments and backend/db sync
      await this.page.getByText(displayUpdated).waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  /**
   * Marks the given todo completed and verifies on list view.
   */
  /**
   * Clears all existing chips then enters each tag (pressing Enter after each).
   * Waits for chip elements to appear after entry.
   */
  async setTags(tags: string[]) {
    // Remove existing chips (× button)
    const removes = this.page.locator('.taginput-remove');
    const count = await removes.count();
    for (let i = 0; i < count; i++) {
      await removes.nth(0).click(); // list updates, always click first
    }
    // Wait for tag input to be attached before proceeding (then check visibility)
    try {
      await this.tagInput.waitFor({ state: 'attached', timeout: 5000 });
      if (!(await this.tagInput.isVisible())) {
        throw new Error("Tag input found in DOM but is not visible. Selector: input[aria-label=\"Tag input\"]");
      }
    } catch (e) {
      // Diagnostic: Dump all <input> on the page with their outerHTML
      const allInputs = await this.page.$$eval('input', nodes =>
        nodes.map(n => n.outerHTML)
      );
      throw new Error(
        "Tag input [aria-label='Tag input'] not found/visible. Nearby input elements:\n" +
        allInputs.join('\n') +
        "\nOriginal error: " + e
      );
    }
    // Type and enter each tag
    for (const tag of tags) {
      await this.tagInput.fill(tag);
      await this.tagInput.press('Enter');
    }
  }

  async completeTodo(title: string) {
    // Filter by the todo title before locating the row
    const displayTitle = title && title.length > 40 ? title.slice(0, 40) : title;
    const filterInput = this.page.locator('input.form-control[placeholder="Filter by Title"]');
    await filterInput.fill(title);
    // Find row and click update
    const row = this.page.locator('table.custom-table tbody tr').filter({
      has: this.page.locator('td').first().filter({ hasText: displayTitle }),
    });
    await row.waitFor({ state: 'visible', timeout: 7000 });
    const updateLink = row.locator('a.btn.btn-sm.btn-primary.me-2');
    await updateLink.waitFor({ state: 'visible', timeout: 5000 });
    await updateLink.scrollIntoViewIfNeeded();
    try {
      await updateLink.click({ trial: true });
      await updateLink.click();
    } catch (e1) {
      try {
        await updateLink.click({ force: true });
      } catch (e2) {
        const href = await updateLink.getAttribute('href');
        if (href) {
          await this.page.goto(this.baseUrl + href);
        } else {
          throw e2;
        }
      }
    }

    // Wait for update landmark
    await this.heading.waitFor({ state: 'visible', timeout: 5000 });

    // Set completed = true (robust against mobile overlays)
    await this.completedCheckbox.waitFor({ state: 'visible', timeout: 3000 });
    if (!(await this.completedCheckbox.isChecked())) {
      try {
        await this.completedCheckbox.scrollIntoViewIfNeeded();
        await this.completedCheckbox.click({ trial: true });
        await this.completedCheckbox.click();
      } catch {
        try {
          // Try force click on the checkbox
          await this.completedCheckbox.click({ force: true });
        } catch {
          // Fall back to label click if checkbox is occluded by row/label
          const completedLabel = this.page.locator('label[for="completedUpdateInput"]');
          await completedLabel.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
          await completedLabel.click({ force: true });
        }
      }
      // Verify it is checked; if not, throw to capture diagnostics
      if (!(await this.completedCheckbox.isChecked())) {
        throw new Error('Failed to set Completed checkbox to true (after multiple click strategies).');
      }
      // Ensure React state has flushed before submitting (controlled checkbox)
      await this.page.waitForFunction(() => {
        const el = document.getElementById('completedUpdateInput') as HTMLInputElement | null;
        return !!el && el.checked === true;
      }, null, { timeout: 2000 }).catch(() => {});
      // Small tick to allow state batching on slower mobile devices
      await this.page.waitForTimeout(100);
    }

    // Submit (update/save)
    await this.updateButton.waitFor({ state: 'visible', timeout: 3000 });

    // Blur inputs and collapse any overlays to avoid intercepted clicks on mobile
    await this.page.evaluate(() => {
      function blurAll() {
        const active = document.activeElement as HTMLElement;
        if (active && typeof active.blur === "function") active.blur();
        Array.from(document.querySelectorAll("input, textarea, select")).forEach((el: any) => {
          if (typeof el.blur === "function") el.blur();
        });
      }
      blurAll();
      const tagInput = document.querySelector('input[aria-label="Tag input"]') as HTMLElement;
      if (tagInput && typeof tagInput.blur === "function") tagInput.blur();
      const dateInput = document.querySelector('input[type="datetime-local"]') as HTMLElement;
      if (dateInput && typeof dateInput.blur === "function") dateInput.blur();
      const tagList = document.querySelector('.taginput-tag-list');
      if (tagList) (tagList as HTMLElement).style.display = 'none';
    });

    await this.updateButton.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);
    // Extra robust scroll: ensure any scrollable ancestors bring the button into view (desktop/tablet)
    await this.page.evaluate((btn) => {
      function scrollParents(el: HTMLElement | null) {
        let node = el ? el.parentElement : null;
        while (node) {
          const style = window.getComputedStyle(node);
          const overflowY = style.overflowY;
          const canScroll = (overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight;
          if (canScroll && el) {
            const rect = el.getBoundingClientRect();
            const containerRect = node.getBoundingClientRect();
            const offset = rect.top - containerRect.top - (containerRect.height / 2 - rect.height / 2);
            node.scrollTop += offset;
          }
          node = node.parentElement;
        }
      }
      if (btn) scrollParents(btn as HTMLElement);
    }, await this.updateButton.elementHandle());
    await this.page.waitForTimeout(200);

    const occluded = await this.page.evaluate((btn) => {
      if (!btn) return true;
      const rect = btn.getBoundingClientRect();
      const el = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return el !== btn;
    }, await this.updateButton.elementHandle());

    if (occluded) {
      await Promise.all([
        this.page.waitForURL('**/'),
        this.updateButton.click({ force: true })
      ]);
    } else {
      await Promise.all([
        this.page.waitForURL('**/'),
        this.updateButton.click()
      ]);
    }
    // Wait for fresh todos payload after navigation
    await this.page.waitForResponse(
      (resp) => resp.url().includes('/api/todos') && resp.request().method() === 'GET' && resp.status() >= 200 && resp.status() < 300,
      { timeout: 10000 }
    ).catch(() => {});
    // Ensure list view heading exists on return before accessing filter controls (with fallback)
    try {
      await this.page.locator('h2.todo-list-title').waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      try {
        if (await this.backButton.isVisible().catch(() => false)) {
          await this.backButton.click();
        } else {
          await this.page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
        }
        await this.page.waitForURL('**/', { timeout: 10000 }).catch(() => {});
        await this.page.locator('h2.todo-list-title').waitFor({ state: 'visible', timeout: 10000 });
      } catch {
        if (!this.page.isClosed()) {
          await this.page.goto(this.baseUrl + '/');
          await this.page.locator('h2.todo-list-title').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        } else {
          return;
        }
      }
    }
    let filterInput2 = this.page.locator('input.form-control[placeholder="Filter by Title"]');
    await filterInput2.waitFor({ state: 'visible', timeout: 10000 });
    await filterInput2.fill(title);


    // Wait for the todo to appear with 'Yes' in Completed column (2nd cell)
    const updatedRow = this.page.locator('table.custom-table tbody tr').filter({
      has: this.page.locator('td').first().filter({ hasText: displayTitle }),
    });
    await updatedRow.waitFor({ state: 'visible', timeout: 10000 });

    // Poll for backend/db update and UI sync: cell[1] should become "Yes"
    await this.page.waitForFunction((t) => {
      const displayTitle = t && t.length > 40 ? t.slice(0, 40) : t;
      const rows = Array.from(document.querySelectorAll('table.custom-table tbody tr'));
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (!cells || cells.length < 2) continue;
        const titleCell = cells[0]?.textContent || '';
        const completedCell = cells[1]?.textContent || '';
        if (titleCell.includes(displayTitle || '') && /yes/i.test(completedCell)) {
          return true;
        }
      }
      return false;
    }, title, { timeout: 30000 });
  }
}
