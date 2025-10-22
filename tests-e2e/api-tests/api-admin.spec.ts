import { test, expect } from '@playwright/test';
import adminData from '../api-test-data/api-admin.json';
import config from '../config.json';

for (const admin of adminData) {
  test.describe(`Admin API tests for ${admin.username}`, () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      // Login as admin and get token
      const loginResponse = await request.post(`${config.apiBaseUrl}/auth/login`, {
        data: {
          username: admin.username,
          password: admin.password
        }
      });
      expect(loginResponse.ok()).toBeTruthy();
      authToken = await loginResponse.text();
    });

    test('should get all users', { tag: '@regression' }, async ({ request }) => {
      const response = await request.get(`${config.apiBaseUrl}/admin/all-users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const users = await response.json();
      expect(Array.isArray(users)).toBeTruthy();
    });

    test('should get pending users', { tag: '@regression' }, async ({ request }) => {
      const response = await request.get(`${config.apiBaseUrl}/admin/pending-users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const pendingUsers = await response.json();
      expect(Array.isArray(pendingUsers)).toBeTruthy();
    });

    test('should approve user by id', { tag: '@regression' }, async ({ request }) => {
      // First get pending users to find a user ID to approve
      const pendingResponse = await request.get(`${config.apiBaseUrl}/admin/pending-users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      expect(pendingResponse.ok()).toBeTruthy();
      const pendingUsers = await pendingResponse.json();

      if (pendingUsers.length > 0) {
        const userToApprove = pendingUsers[0];
        const approveResponse = await request.post(`${config.apiBaseUrl}/admin/approve-user/${userToApprove.id}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        expect(approveResponse.ok()).toBeTruthy();
      } else {
        // If no pending users, this test passes (no users to approve)
        expect(true).toBeTruthy();
      }
    });
  });
}
