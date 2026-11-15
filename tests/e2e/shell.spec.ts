import { expect, test } from '@playwright/test';

test('theme toggle flips the emulated scheme and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  await page.getByRole('button', { name: 'Toggle dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('invalid stored theme falls back to system dark at first paint', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  await context.addInitScript(() => localStorage.setItem('theme', 'blue'));
  const page = await context.newPage();
  await page.goto('http://localhost:4321/portfolio-preview/');
  const background = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  expect(background).toBe('rgb(13, 10, 21)');
  await context.close();
});

test('language switch goes to /pl/ and sets html lang', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Zmień język na polski' }).click();
  await expect(page).toHaveURL(/\/portfolio-preview\/pl\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
});

test('header links resolve under the base path', async ({ page }) => {
  await page.goto('./');
  const hrefs = await page.locator('header a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(2);
  for (const href of hrefs) expect(href).toMatch(/^\/portfolio-preview\//);
});
