import { expect, test, type Page } from '@playwright/test';
import { showSwitches } from './helpers';

const EXCLUDED = 'a, button, [role=button], .stage, .project-card, .skill, .quote, header, h1, h2, h3, p, li, blockquote, figure';

/** Finds a viewport point whose topmost element is plain background. */
async function emptyPoint(page: Page): Promise<{ x: number; y: number }> {
  const point = await page.evaluate((excluded) => {
    for (let y = innerHeight - 40; y > 80; y -= 37) {
      for (let x = 30; x < innerWidth - 20; x += 41) {
        const element = document.elementFromPoint(x, y);
        if (element && !element.closest(excluded)) return { x, y };
      }
    }
    return null;
  }, EXCLUDED);
  expect(point).not.toBeNull();
  return point!;
}

const traceLines = (page: Page) => page.locator('.grid-layer .tv, .grid-layer .th');

test('ambient tracers draw a few lines at a time', async ({ page }) => {
  await page.goto('./');
  await page.waitForTimeout(2500);
  expect(await page.locator('.grid-layer .dot').count()).toBeGreaterThan(0);
  for (let sample = 0; sample < 5; sample++) {
    expect(await traceLines(page).count()).toBeLessThanOrEqual(4);
    await page.waitForTimeout(400);
  }
});

test('clicking empty background sends a burst with a ring', async ({ page }) => {
  await page.goto('./');
  const { x, y } = await emptyPoint(page);
  await page.mouse.click(x, y);
  await expect(page.locator('.grid-layer [data-origin="burst"]')).toHaveCount(4);
  await expect(page.locator('.grid-layer .ring')).toHaveCount(1);
});

test('clicking a link does not burst', async ({ page }) => {
  await page.goto('./');
  await page.locator('header a').first().click();
  await page.waitForTimeout(100);
  await expect(page.locator('.grid-layer [data-origin="burst"]')).toHaveCount(0);
  await expect(page.locator('.grid-layer .ring')).toHaveCount(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows static grid lines and no tracers', async ({ page }) => {
    await page.goto('./');
    const vertical = page.locator('.grid-layer .v').first();
    await expect(vertical).toBeVisible();
    for (let sample = 0; sample < 5; sample++) {
      expect(await page.locator('.grid-layer .dot').count()).toBe(0);
      await page.waitForTimeout(600);
    }
    const transform = await vertical.evaluate((element) => getComputedStyle(element).transform);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
  });
});

test('resizing does not create horizontal scroll', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'phone project only');
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('./');
  await page.setViewportSize({ width: 800, height: 740 });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('background persists across client navigation without redrawing', async ({ page }) => {
  await page.goto('./');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { (document.querySelector('.grid-layer') as HTMLElement & { marker?: boolean }).marker = true; });
  await showSwitches(page);
  await page.getByRole('link', { name: 'Zmień język na polski' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  const state = await page.evaluate(() => {
    const layer = document.querySelector('.grid-layer') as HTMLElement & { marker?: boolean };
    const line = layer.querySelector('.v') as HTMLElement;
    return { marker: layer.marker === true, transform: getComputedStyle(line).transform };
  });
  expect(state.marker).toBe(true);
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(state.transform);
});
