import { expect, test } from '@playwright/test';

test.describe('hero', () => {
  test('h1 has the full name as accessible name', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1, name: 'Łukasz Moszczyński' })).toBeVisible();
  });

  test('content is readable at rest (nothing left transparent)', async ({ page }) => {
    await page.goto('./');
    await page.waitForTimeout(3500);
    for (const selector of ['.hero .eyebrow', '.hero .claim', '.hero .sub']) {
      await expect(page.locator(selector)).toHaveCSS('opacity', '1');
    }
  });

  test('letters get heavier near the pointer and relax on leave', async ({ page, isMobile }) => {
    test.skip(!!isMobile || (page.viewportSize()?.width ?? 0) < 700, 'fine pointer only');
    await page.goto('./');
    await page.waitForTimeout(2500);
    const first = page.locator('.hero .name .line').nth(1).locator('.char').first();
    const far = page.locator('.hero .name .line').first().locator('.char').last();
    const box = (await first.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
    await expect.poll(async () => Number(await first.evaluate((el) => getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(800);
    await expect.poll(async () => Number(await far.evaluate((el) => getComputedStyle(el).fontWeight))).toBeLessThanOrEqual(450);
    await page.mouse.move(5, 5);
    await page.mouse.move(2, 600);
    await expect.poll(async () => Number(await first.evaluate((el) => getComputedStyle(el).fontWeight))).toBe(300);
  });
});
