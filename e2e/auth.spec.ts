import { test, expect } from '@playwright/test';
import { cleanTestData, seedTestUsers, closeDb } from './fixtures/db';
import { TEST_USERS, login } from './fixtures/auth';

test.describe('Authentication', () => {
  test.beforeAll(async () => {
    await cleanTestData();
    await seedTestUsers();
  });

  test.afterAll(async () => {
    await closeDb();
  });

  test('1.3 — Sign in with valid credentials', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/community', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/community/);
  });

  test('1.4 — Sign in with wrong password shows Georgian error', async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Wait for error message in Georgian
    await expect(page.locator('text=არასწორი ელფოსტა ან პაროლი')).toBeVisible({
      timeout: 5000,
    });
  });

  test('1.5 — Sign out redirects to landing page', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="sign-out"]');
    await page.waitForURL('/', { timeout: 10_000 });
    await expect(page).toHaveURL('/');
  });

  test('1.6 — Access /community without auth redirects to sign-in', async ({ page }) => {
    await page.goto('/community');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('1.7 — Access /admin as non-admin is blocked', async ({ page }) => {
    await login(page, TEST_USERS.free.email, TEST_USERS.free.password);
    await page.goto('/admin');
    // Should redirect to /community (not admin)
    await expect(page).toHaveURL(/\/community/);
  });

  test('1.8 — Access /admin as admin loads page', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    // Admin page should have analytics content
    await expect(page.locator('text=ადმინ პანელი')).toBeVisible({ timeout: 5000 });
  });
});
