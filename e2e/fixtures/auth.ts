import { test as base, type Page } from '@playwright/test';

export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'testpass123',
    name: 'ადმინი',
  },
  paid: {
    email: 'paid@test.com',
    password: 'testpass123',
    name: 'ფასიანი წევრი',
  },
  free: {
    email: 'free@test.com',
    password: 'testpass123',
    name: 'უფასო წევრი',
  },
} as const;

/**
 * Log in a test user via the sign-in form.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect to community page
  await page.waitForURL('**/community', { timeout: 10_000 });
}

/**
 * Log out the current user.
 */
export async function logout(page: Page) {
  // Click avatar dropdown or menu, then sign out
  // The app header has a dropdown with sign out
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="sign-out"]');
  await page.waitForURL('/', { timeout: 10_000 });
}

/**
 * Sign up a new user via the sign-up form.
 */
export async function signup(page: Page, email: string, password: string) {
  await page.goto('/sign-up');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/community', { timeout: 10_000 });
}

/**
 * Custom test fixture that provides logged-in pages for each user type.
 */
export const test = base.extend<{
  adminPage: Page;
  paidPage: Page;
  freePage: Page;
}>({
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await use(page);
    await ctx.close();
  },
  paidPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, TEST_USERS.paid.email, TEST_USERS.paid.password);
    await use(page);
    await ctx.close();
  },
  freePage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, TEST_USERS.free.email, TEST_USERS.free.password);
    await use(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
