import { test, expect } from '@playwright/test';
import authData from '../api-test-data/api-auth.json';
import config from '../config.json';

for (const user of authData) {
  test(`should login user ${user.username}`, { tag: ['@regression', '@smoke'] }, async ({ request }) => {
    const response = await request.post(`${config.apiBaseUrl}/auth/login`, {
      data: {
        username: user.username,
        password: user.password
      }
    });

    expect(response.ok()).toBeTruthy();
    const token = await response.text();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
}
