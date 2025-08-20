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
  readonly createButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page, baseUrl: string) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.logoImg = page.getByAltText('Logo');
    this.titleInput = page.getByPlaceholder('Enter todo title');
    this.activityTypeSelect = page.locator('select');
    this.activityTypeOptionDefinite = page.locator('option[value="definite"]');
    this.activityTypeOptionRegular = page.locator('option[value="regular"]');
    this.completedCheckbox = page.locator('#completedInput');
    this.startDateInput = page.locator('input[type="datetime-local"]');
    this.createButton = page.getByRole('button', { name: /^Create Todo$/ });
    this.backButton = page.getByRole('button', { name: /^Back$/ });
  }

  async goto() {
    await this.page.goto(this.baseUrl + '/create');
    await this.page.waitForLoadState('networkidle');
    await this.titleInput.waitFor({ state: 'visible', timeout: 5000 });
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
    await this.createButton.click();
  }

  async clickBack() {
    await this.backButton.click();
  }
}
