import { expect, test } from '@playwright/test';

test('retired 0.4.0 baseline addresses lead to the current home page', async ({ page }) => {
  await page.route('**/assistant/**', route => route.fulfill({ status: 503, json: { error: 'offline' } }));
  for (const old of ['/baseline', '/baseline/join', '/chat', '/ledger', '/model']) {
    await page.goto(old);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('An open AI that');
  }
});

test('the home page states plainly when the network cannot be read', async ({ page }) => {
  await page.route('**/assistant/**', route => route.fulfill({ status: 503, json: { error: 'offline' } }));
  await page.goto('/');
  await expect(page.getByText('The network can’t be read right now')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Try it in three steps.' })).toBeVisible();
});

test('mobile navigation is usable and nothing overflows', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/assistant/**', route => route.fulfill({ status: 503, json: { error: 'offline' } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.locator('nav').getByRole('link', { name: 'Run a node', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Run a node.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.goto('/help');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
