import { readdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { langSwitch, themeSwitch } from './helpers';

/** Every page in both languages (and the 404), visited like a reader would. */
const slugs = readdirSync('src/content/projects/en').map((file) => file.replace(/\.[^.]+$/, ''));
const pages = ['./', 'work/', ...slugs.map((slug) => `work/${slug}/`)].flatMap((path) => [path, path === './' ? 'pl/' : `pl/${path}`]);

const settled = (page: Page) => expect(page.locator('html')).not.toHaveAttribute('data-astro-transition', /.*/);

/** Scroll the whole page down in steps (scrubs, pins and reveals all run), then back to the top. */
async function scrollThrough(page: Page) {
  const step = await page.evaluate(() => Math.round(window.innerHeight * 0.5));
  for (let top = 0; ; top += step) {
    const bottom = await page.evaluate((target) => {
      window.scrollTo({ top: target, behavior: 'instant' });
      return target + window.innerHeight >= document.documentElement.scrollHeight;
    }, top);
    await page.waitForTimeout(50);
    if (bottom) break;
  }
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(200);
}

/** Hover a few links, cards and buttons that are on screen (desktop) or tap-free focus them (phone). */
async function hoverAround(page: Page, fine: boolean) {
  const targets = page.locator('main a:visible, main button:visible, main .project-card:visible, main .work-index-card:visible');
  const count = Math.min(await targets.count(), 8);
  for (let index = 0; index < count; index++) {
    const target = targets.nth(index);
    await target.scrollIntoViewIfNeeded().catch(() => {});
    if (fine) await target.hover({ timeout: 2000 }).catch(() => {});
    else await target.focus().catch(() => {});
    await page.waitForTimeout(60);
  }
  if (!fine) return;
  // Sweep the pointer across project visuals (3D tilt) and the page (spotlight, hover cell).
  const visuals = page.locator('main .project-visual:visible');
  for (let index = 0; index < Math.min(await visuals.count(), 3); index++) {
    await visuals.nth(index).scrollIntoViewIfNeeded().catch(() => {});
    const box = await visuals.nth(index).boundingBox();
    if (!box) continue;
    for (let step = 0; step <= 8; step++) await page.mouse.move(box.x + (box.width * step) / 8, box.y + box.height / 2);
  }
  for (let step = 0; step <= 10; step++) await page.mouse.move(40 + step * 120, 200 + step * 40);
}

test('browsing every page produces no console warnings or errors', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const messages: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') messages.push(`[${message.type()}] ${page.url()} :: ${message.text()}`);
  });
  page.on('pageerror', (error) => messages.push(`[pageerror] ${page.url()} :: ${error.message}`));
  const fine = testInfo.project.name === 'desktop';

  for (const path of pages) {
    await page.goto(path);
    await expect(page.locator('html')).not.toHaveClass(/init-pending/);
    await scrollThrough(page);
    await hoverAround(page, fine);
    // Menu: open and close.
    const toggle = page.locator('header .menu-toggle');
    await toggle.click();
    await expect(page.locator('#site-menu')).toBeVisible();
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await expect(page.locator('#site-menu')).toBeHidden();
  }

  // Theme and language switches, and client-side navigation back and forth.
  await page.goto('./');
  await expect(page.locator('html')).not.toHaveClass(/init-pending/);
  for (let round = 0; round < 2; round++) {
    await (await themeSwitch(page)).click();
    if (await page.locator('#site-menu').isVisible()) await page.keyboard.press('Escape');
    await (await langSwitch(page)).click();
    await expect(page.locator('html')).toHaveAttribute('lang', round === 0 ? 'pl' : 'en');
    await settled(page);
    await scrollThrough(page);
  }
  await page.locator('#work a.project-link').first().click();
  await expect(page).toHaveURL(/\/work\/[^/]+\/$/);
  await settled(page);
  await scrollThrough(page);
  await page.goBack();
  await settled(page);
  await scrollThrough(page);

  expect([...new Set(messages)]).toEqual([]);
});
