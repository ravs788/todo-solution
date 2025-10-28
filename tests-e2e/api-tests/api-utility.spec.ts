import { test, expect } from '@playwright/test';
import config from '../config.json';

const API_BASE_URL = config.apiBaseUrl;

test.describe('Utility API Tests', () => {
  // Note: These utility endpoints may not be implemented or may require different paths

  test('should check database health', { tag: '@regression' }, async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/db-health`);

    expect(response.ok()).toBeTruthy();
    const responseText = await response.text();
    expect(responseText).toBeTruthy();
    expect(responseText).toContain('Database connection');
    // The health endpoint returns a simple string response
  });

  test('should get tag suggestions without search parameter', { tag: '@regression' }, async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/tags/suggest`);

    expect(response.ok()).toBeTruthy();
    const tags = await response.json();
    expect(Array.isArray(tags)).toBeTruthy();
  });

  test('should get tag suggestions with search parameter', { tag: '@regression' }, async ({ request }) => {
    const searchTerm = 'test';
    const response = await request.get(`${API_BASE_URL}/tags/suggest?search=${searchTerm}`);

    expect(response.ok()).toBeTruthy();
    const tags = await response.json();
    expect(Array.isArray(tags)).toBeTruthy();
    // Tags should be filtered based on search term (if any matching tags exist)
  });

  test('should get tag suggestions with empty search parameter', { tag: '@regression' }, async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/tags/suggest?search=`);

    expect(response.ok()).toBeTruthy();
    const tags = await response.json();
    expect(Array.isArray(tags)).toBeTruthy();
  });
});
