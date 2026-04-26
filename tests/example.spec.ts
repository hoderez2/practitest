import { test, expect } from '@playwright/test';

test.describe('PractiTest Demo', () => {
  test('Homepage loads', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page.getByText('Example Domain')).toBeVisible();
  });

  test('Intentional failure', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page.getByText('Something that does not exist')).toBeVisible();
  });
});
