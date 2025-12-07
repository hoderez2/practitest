import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://www.jsonmaster.com/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/JSON Online Validator and Formatter | jsonmaster.com/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

test('Check Login', async ({ page }) => {
  await page.goto('https://www.jsonmaster.com/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/JSON גםקד torsss and Formatter | jsonmaster.com/);
});

test('Checkout', {
  tag: '@smoke',
}, async ({ page }) => {
  
  await page.goto('https://playwright.dev/');
  await expect(page.getByRole('main')).toContainText('Any browser • Any platform • One API');
  await expect(page.locator('h1')).toContainText('Playwright');
});

test('Help Link', {
}, async ({ page }) => {
  
  await page.goto('https://www.practitest.com/');
  await page.getByRole('banner').getByRole('link', { name: 'Help' }).click();
  await expect(page.getByRole('heading', { name: 'How can we help?' })).toBeVisible();
});

test('API Help Page Via our Help', {
}, async ({ page }) => {
  
  await page.goto('https://www.practitest.com/api-v2/');
  await expect(page.getByRole('img', { name: 'PractiTest Logo' })).toBeVisible();
});
