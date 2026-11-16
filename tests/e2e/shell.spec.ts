import { expect, test } from '@playwright/test';

test('theme toggle flips the emulated scheme and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  const toggle = page.getByRole('button', { name: 'Dark / Light, dark mode' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
});

test('header controls are named by their visible text first (WCAG 2.5.3)', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('link', { name: /^ŁM\./ })).toHaveCount(1);
  await expect(page.getByRole('link', { name: /^PL – / })).toHaveCount(1);
  await expect(page.getByRole('button', { name: /^Dark \/ Light/ })).toHaveCount(1);
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

test('robots.txt points at the sitemap under the base path', async ({ request }) => {
  const response = await request.get('robots.txt');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toMatch(/^Sitemap: https:\/\/lukaszmoszczynski\.github\.io\/portfolio-preview\/sitemap-index\.xml$/m);
});
