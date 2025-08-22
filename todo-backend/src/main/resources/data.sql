-- Seed users needed for CI Playwright E2E tests

INSERT INTO user (id, username, password, status, role) VALUES
  (1001, 'testuser262501', '$2a$10$uV/Xr7RkghEbbK9O4Ch8T.CEds5YcQ8h0mP2sbVcs87S3tWxa6m7m', 'ACTIVE', 'USER');
