import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('9.1 — Public landing page loads with community info', async ({ page }) => {
    await page.goto('/');
    // Should show community name
    await expect(page.locator('text=AI წრე')).toBeVisible({ timeout: 5000 });
    // Should show join CTA
    await expect(page.locator('text=გაწევრიანება')).toBeVisible();
  });

  test('9.2 — Member count is shown', async ({ page }) => {
    await page.goto('/');
    // The landing page shows member count with "წევრი" text
    await expect(page.locator('text=წევრი')).toBeVisible();
  });

  test('9.3 — Join CTA leads to signup', async ({ page }) => {
    await page.goto('/');
    // Click the main join button (the big CTA in the hero)
    const joinButton = page.locator('a[href="/sign-up"]').first();
    await joinButton.click();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('9.4 — Pricing section shows tiers', async ({ page }) => {
    await page.goto('/');
    // Scroll to pricing
    await expect(page.locator('text=ფასები')).toBeVisible();
    // Should show Free tier
    await expect(page.locator('text=უფასო')).toBeVisible();
    // Should show Paid tier
    await expect(page.locator('text=ფასიანი')).toBeVisible();
  });

  test('Sign in link works', async ({ page }) => {
    await page.goto('/');
    const signInLink = page.locator('a[href="/sign-in"]');
    await signInLink.click();
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
