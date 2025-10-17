import { test, expect } from '@playwright/test';
import loginUsers from '../test-data/login-users.json';
import config from '../../config.json';

import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { CreateTodoPage } from '../pages/CreateTodoPage';
import { UpdateTodoPage } from '../pages/UpdateTodoPage';

/**
 * E2E test: verify adding & replacing tags on an existing Todo using the TagInput UI.
 * Re-uses the first predefined test user in login-users.json.
 */
const user = loginUsers[0];

test.describe('Todo – update tags flow', () => {
  test('existing user can add & replace tags on a todo', async ({ page }) => {
    const loginPage   = new LoginPage(page, config.baseUrl);
    const homePage    = new HomePage(page, config.baseUrl);
    const createPage  = new CreateTodoPage(page, config.baseUrl);
    const updatePage  = new UpdateTodoPage(page, config.baseUrl);

    /* 1) Login */
    await loginPage.goto();
    await loginPage.login(user.username, user.password);

    /* 2) Create a todo without tags (unique title) */
    const uniqueSuffix = Date.now().toString().slice(-6);
    const baseTitle    = `Tag Update Todo ${uniqueSuffix}`;

    await createPage.goto();
    await createPage.createTodo(baseTitle, 'definite', false, new Date().toISOString().slice(0,16));

    /* 3) Add tags ["urgent","critical"] */
    await updatePage.goto();
    await updatePage.editTodoFromModel({ id: -1, title: baseTitle, _uiOldTitle: baseTitle, tags: ['urgent', 'critical'] });

    // Assert both chips visible in list row
    await expect(page.getByText(baseTitle)).toBeVisible();
    await expect(page.getByText('urgent')).toBeVisible();
    await expect(page.getByText('critical')).toBeVisible();

    /* 4) Replace with single tag ["home"] */
    await updatePage.goto();
    await updatePage.editTodoFromModel({ id: -1, title: baseTitle, _uiOldTitle: baseTitle, tags: ['home'] });

    // Assert only "home" tag remains
    await expect(page.getByText(baseTitle)).toBeVisible();
    // Only assert 'home' tag is visible in the row for this todo (avoid nav link conflict)
    const todoRow = page.locator('table tr').filter({ hasText: baseTitle });
    await expect(todoRow.getByText('home', { exact: true })).toBeVisible();
    await expect(page.locator('text=urgent')).toHaveCount(0);
    await expect(page.locator('text=critical')).toHaveCount(0);
  });
});
