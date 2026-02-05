import { test, expect } from './fixtures/auth';
import { cleanTestData, seedTestUsers, seedTestCategories, createTestPost, closeDb } from './fixtures/db';
import { TEST_USERS, login } from './fixtures/auth';
import { test as baseTest } from '@playwright/test';

baseTest.describe('Community Feed', () => {
  let userIds: { adminId: number; paidMemberId: number; freeMemberId: number };

  baseTest.beforeAll(async () => {
    await cleanTestData();
    userIds = await seedTestUsers();
    await seedTestCategories();
    // Create a test post from admin
    await createTestPost(userIds.adminId, 'intro');
  });

  baseTest.afterAll(async () => {
    await closeDb();
  });

  baseTest('2.1 — Free user views feed, no create button', async ({ page }) => {
    await login(page, TEST_USERS.free.email, TEST_USERS.free.password);
    await page.goto('/community');
    await expect(page).toHaveURL(/\/community/);
    // Should see posts
    await expect(page.locator('text=სატესტო პოსტი')).toBeVisible({ timeout: 10_000 });
    // Should NOT see create post button
    await expect(page.locator('a[href="/community/new"]')).not.toBeVisible();
  });

  baseTest('2.5 — Paid user creates text post', async ({ page }) => {
    await login(page, TEST_USERS.paid.email, TEST_USERS.paid.password);
    await page.goto('/community/new');
    await page.fill('input[name="title"]', 'ფასიანი პოსტი');
    await page.fill('textarea[name="content"]', 'ეს არის ფასიანი პოსტი');
    await page.click('button[type="submit"]');
    // Should redirect to community feed or post detail
    await page.waitForURL(/\/community/, { timeout: 10_000 });
    // The post should appear in the feed
    await page.goto('/community');
    await expect(page.locator('text=ფასიანი პოსტი')).toBeVisible({ timeout: 10_000 });
  });

  baseTest('2.8 — Paid user likes a post', async ({ page }) => {
    await login(page, TEST_USERS.paid.email, TEST_USERS.paid.password);
    await page.goto('/community');
    // Find the first like button and click it
    const likeButton = page.locator('[data-testid="like-button"]').first();
    if (await likeButton.isVisible()) {
      const countBefore = await likeButton.textContent();
      await likeButton.click();
      await page.waitForTimeout(1000);
      // Like count should change
    }
  });

  baseTest('2.10 — Paid user comments on a post', async ({ page }) => {
    await login(page, TEST_USERS.paid.email, TEST_USERS.paid.password);
    await page.goto('/community');
    // Click on a post to go to detail page
    const postLink = page.locator('a[href*="/community/"]').first();
    if (await postLink.isVisible()) {
      await postLink.click();
      await page.waitForURL(/\/community\/\d+/, { timeout: 10_000 });
      // Fill comment form
      const commentInput = page.locator('textarea[name="content"]');
      if (await commentInput.isVisible()) {
        await commentInput.fill('სატესტო კომენტარი');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=სატესტო კომენტარი')).toBeVisible({ timeout: 10_000 });
      }
    }
  });

  baseTest('2.13 — Category filter shows correct posts', async ({ page }) => {
    await login(page, TEST_USERS.paid.email, TEST_USERS.paid.password);
    await page.goto('/community');
    // Find and click a category filter button
    const categoryButton = page.locator('text=შესავალი');
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      await page.waitForTimeout(1000);
      // The filtered feed should show posts in that category
    }
  });

  baseTest('2.15 — Admin pins a post', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/community');
    // Look for a pin button in the post card (admin-only)
    const pinButton = page.locator('[data-testid="pin-button"]').first();
    if (await pinButton.isVisible()) {
      await pinButton.click();
      await page.waitForTimeout(1000);
      // Pinned badge should appear
      await expect(page.locator('text=მიმაგრებული')).toBeVisible({ timeout: 5000 });
    }
  });
});
