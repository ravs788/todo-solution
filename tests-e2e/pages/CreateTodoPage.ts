import { Page, Locator } from '@playwright/test';

/**
 * Page Object for creating a todo item.
 * Adjust selectors and navigation according to your actual app.
 */
export class CreateTodoPage {
  readonly page: Page;
  readonly baseUrl: string;
  readonly logoImg: Locator;
  readonly titleInput: Locator;
  readonly activityTypeSelect: Locator;
  readonly activityTypeOptionDefinite: Locator;
  readonly activityTypeOptionRegular: Locator;
  readonly completedCheckbox: Locator;
  readonly startDateInput: Locator;
  readonly reminderAtInput: Locator;
  readonly createButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.logoImg = page.getByAltText('Logo');
    this.titleInput = page.getByPlaceholder('Enter todo title');
    this.activityTypeSelect = page.getByLabel('Activity Type');
    this.activityTypeOptionDefinite = page.locator('option[value="definite"]');
    this.activityTypeOptionRegular = page.locator('option[value="regular"]');
    this.completedCheckbox = page.locator('#completedInput');
    // Narrow datetime-local fields by accessible name to avoid strict mode violations
    this.startDateInput = page.getByRole('textbox', { name: 'Start Date' });
    this.reminderAtInput = page.getByRole('textbox', { name: /Reminder At/i });
    this.createButton = page.getByRole('button', { name: /create/i });
    this.backButton = page.getByRole('button', { name: /^Back$/ });
  }

  async goto() {
    await this.page.goto(this.baseUrl + '/create');
    // Avoid waiting for networkidle due to dev server websockets; DOMContentLoaded is sufficient
    await this.page.waitForLoadState('domcontentloaded');
    await this.titleInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Fills and submits the Create Todo form using explicit parameters.
   * @deprecated prefer createTodoFromModel
   */
  async createTodo(
    title: string,
    activityType: 'definite' | 'regular',
    completed: boolean,
    startDate: string
  ) {
    await this.createTodoFromModel({
      title,
      activityType,
      startDate,
      completed,
    });
  }

  /**
   * Fills and submits the Create Todo form using a CreateTodoRequest model.
   */
  async createTodoFromModel(req: import('../models/CreateTodoRequest').CreateTodoRequest) {
    await this.titleInput.fill(req.title);
    await this.activityTypeSelect.selectOption(req.activityType);
    if (await this.completedCheckbox.count()) {
      if ((await this.completedCheckbox.isChecked()) !== !!req.completed) {
        await this.completedCheckbox.click();
      }
    }
    if (req.startDate) {
      await this.startDateInput.fill(req.startDate);
    }
    // On mobile: blur active element, blur/tag-collapse specialized
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
      // Hide any open tag list/dropdown (if possible)
      const tagList = document.querySelector('.taginput-tag-list');
      if (tagList) (tagList as HTMLElement).style.display = 'none';
    });

    // Robustly scroll Create button node (not selector guess)
    const btnHandle = await this.createButton.elementHandle();
    if (btnHandle) {
      await this.page.evaluate((btn) => {
        if (btn && typeof (btn as any).scrollIntoView === "function") {
          (btn as any).scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
        }
      }, btnHandle);
    }

    await this.page.waitForTimeout(700);

    // Extra: check the Create button is really visible and not occluded
    let isOccluded = false;
    const btnHandle2 = await this.createButton.elementHandle();
    if (btnHandle2) {
      isOccluded = await this.page.evaluate((btn) => {
        const rect = (btn as HTMLElement).getBoundingClientRect();
        const docEl = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
        return docEl !== btn;
      }, btnHandle2);
    }
    if (isOccluded) {
      throw new Error('Create button is occluded by another element after all scroll/blur attempts. Check floating UI, virtual keyboard, and overlays.');
    }

    await this.createButton.click();
  }

  async clickBack() {
    await this.backButton.click();
  }
}
