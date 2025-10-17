import { test, expect } from '@playwright/test';
import authData from '../api-test-data/api-auth-full.json';
import config from '../config.json';

const API_BASE_URL = config.apiBaseUrl;

for (const testData of authData) {
  test.describe('Complete Authentication API Tests', () => {
    test('should register a new user', async ({ request }) => {
      const uniqueUsername = `newuser${Date.now()}`;
      const response = await request.post(`${API_BASE_URL}/auth/register`, {
        data: {
          username: uniqueUsername,
          password: testData.register.password
        }
      });

      expect(response.status()).toBe(201);
      const responseText = await response.text();
      expect(responseText).toContain('User registered successfully');

      // Update the test data with the unique username for the approval test
      testData.register.username = uniqueUsername;
    });

    test('should login existing user', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          username: testData.login.username,
          password: testData.login.password
        }
      });

      expect(response.ok()).toBeTruthy();
      const token = await response.text();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    test('should reset password for existing user', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/reset-password`, {
        data: {
          username: testData.login.username,
          newPassword: testData.passwordReset.newPassword
        }
      });

      expect(response.ok()).toBeTruthy();
      const responseText = await response.text();
      expect(responseText).toContain('Password has been reset');
    });

    test('should login with new password after reset', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          username: testData.login.username,
          password: testData.passwordReset.newPassword
        }
      });

      expect(response.ok()).toBeTruthy();
      const token = await response.text();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    test('should reset password back to original', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/reset-password`, {
        data: {
          username: testData.login.username,
          newPassword: testData.login.password
        }
      });

      expect(response.ok()).toBeTruthy();
      const responseText = await response.text();
      expect(responseText).toContain('Password has been reset');
    });

    test.describe('Admin user approval flow', () => {
      let adminToken: string;

      test.beforeAll(async ({ request }) => {
        // Login as admin
        const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
          data: {
            username: testData.admin.username,
            password: testData.admin.password
          }
        });
        expect(loginResponse.ok()).toBeTruthy();
        adminToken = await loginResponse.text();
      });

      test('admin should approve registered user', async ({ request }) => {
        // Use the working admin approval endpoint (/api/admin/approve-user/{id})
        // First get the user ID from pending users
        const pendingResponse = await request.get(`${API_BASE_URL}/admin/pending-users`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(pendingResponse.ok()).toBeTruthy();
        const pendingUsers = await pendingResponse.json();

        // Find the user we just registered
        const registeredUser = pendingUsers.find((user: any) => user.username === testData.register.username);
        expect(registeredUser).toBeTruthy();

        // Approve the user by ID using the working endpoint
        const approveResponse = await request.post(`${API_BASE_URL}/admin/approve-user/${registeredUser.id}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(approveResponse.ok()).toBeTruthy();
      });

      test('approved user should be able to login', async ({ request }) => {
        const response = await request.post(`${API_BASE_URL}/auth/login`, {
          data: {
            username: testData.register.username,
            password: testData.register.password
          }
        });

        expect(response.ok()).toBeTruthy();
        const token = await response.text();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });
    });
  });
}
