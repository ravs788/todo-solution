import { test, expect } from '@playwright/test';
import todoData from '../api-test-data/api-todos.json';
import config from '../config.json';

for (const userData of todoData) {
  test.describe(`Todo API tests for ${userData.username}`, () => {
    let authToken: string;
    let createdTodoId: number;

    test.beforeEach(async ({ request }) => {
      // Login and get token
      const loginResponse = await request.post(`${config.apiBaseUrl}/auth/login`, {
        data: {
          username: userData.username,
          password: userData.password
        }
      });
      expect(loginResponse.ok()).toBeTruthy();
      authToken = await loginResponse.text();
    });

    test('should create a new todo', { tag: '@regression' }, async ({ request }) => {
      const todoToCreate = userData.todos[0];
      const response = await request.post(`${config.apiBaseUrl}/todos`, {
        data: {
          title: todoToCreate.title
        },
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.ok()).toBeTruthy();
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('id');
      expect(responseBody.title).toBe(todoToCreate.title);
      expect(responseBody.completed).toBe(false); // default value
      createdTodoId = responseBody.id;
    });

    test('should get all todos', { tag: '@regression' }, async ({ request }) => {
      const response = await request.get(`${config.apiBaseUrl}/todos`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const todos = await response.json();
      expect(Array.isArray(todos)).toBeTruthy();
      // Should contain at least the todo we created
      expect(todos.length).toBeGreaterThanOrEqual(1);
    });

    test('should get todo by id', { tag: '@regression' }, async ({ request }) => {
      const response = await request.get(`${config.apiBaseUrl}/todos/${createdTodoId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const todo = await response.json();
      expect(todo.id).toBe(createdTodoId);
      expect(todo.title).toBe(userData.todos[0].title);
    });

    test('should update todo', { tag: '@regression' }, async ({ request }) => {
      const updatedTitle = 'Updated ' + userData.todos[0].title;
      const response = await request.put(`${config.apiBaseUrl}/todos/${createdTodoId}`, {
        data: {
          title: updatedTitle,
          completed: true
        },
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.ok()).toBeTruthy();
      const updatedTodo = await response.json();
      expect(updatedTodo.title).toBe(updatedTitle);
      expect(updatedTodo.completed).toBeTruthy();
    });

    test('should delete todo', { tag: '@regression' }, async ({ request }) => {
      const response = await request.delete(`${config.apiBaseUrl}/todos/${createdTodoId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(204); // No Content

      // Verify it's deleted by trying to get it
      const getResponse = await request.get(`${config.apiBaseUrl}/todos/${createdTodoId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      expect(getResponse.status()).toBe(404);
    });
  });
}
