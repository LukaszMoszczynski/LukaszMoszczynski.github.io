import { expect, test, type Page } from '@playwright/test';

const steps = (page: Page) => page.locator('.build .steps button');

async function reachBuild(page: Page) {
  await page.goto('./');
  await page.waitForTimeout(800);
  await page.locator('.build').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
}

test.describe('token build', () => {
  test('section, heading and four step buttons are there in both languages', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 2, name: 'From token to page.' })).toBeAttached();
    await expect(steps(page)).toHaveCount(4);
    await expect(page.locator('.build .stage')).toHaveCount(1);
    await page.goto('pl/');
    await expect(page.getByRole('heading', { level: 2, name: 'Od tokenu do strony.' })).toBeAttached();
    await expect(page.locator('.build .p-accent .label')).toHaveText('Kup teraz');
  });

  test('clicking 03 jumps to that step', async ({ page }) => {
    await reachBuild(page);
    const third = steps(page).nth(2);
    await third.click();
    await expect(third).toHaveClass(/\bon\b/, { timeout: 1500 });
    await expect(third).toHaveAttribute('aria-current', 'step');
    await page.waitForTimeout(1500);
    await expect(third).toHaveClass(/\bon\b/);
    await expect(steps(page).filter({ has: page.locator('xpath=self::*[contains(concat(" ", @class, " "), " on ")]') })).toHaveCount(1);
    await expect(page.locator('.build')).toBeInViewport();
  });

  test('Enter on focused 04 jumps to the last step', async ({ page }) => {
    await reachBuild(page);
    const fourth = steps(page).nth(3);
    await fourth.focus();
    await page.keyboard.press('Enter');
    await expect(fourth).toHaveClass(/\bon\b/, { timeout: 1500 });
    await page.waitForTimeout(1500);
    await expect(fourth).toHaveClass(/\bon\b/);
    await expect(page.locator('.build .p-page')).toHaveAttribute('style', /(?:^|[;s])left: 2%/);
  });

  test('the active step shows its description, the others stay in the accessibility tree', async ({ page }) => {
    await reachBuild(page);
    const active = page.locator('.build .steps button.on');
    await expect(active).toHaveCount(1);
    await expect(active.locator('small')).toBeVisible();
    const box = (await active.locator('small').boundingBox())!;
    expect(box.height).toBeGreaterThan(12);
    const inactive = page.locator('.build .steps button:not(.on) small');
    await expect(inactive).toHaveCount(3);
    for (const description of await inactive.all()) await expect(description).toHaveCSS('display', 'block');
  });

  test('pieces are visible at rest after entering', async ({ page }) => {
    await reachBuild(page);
    await page.waitForTimeout(1200);
    const scales = await page.locator('.build .piece').evaluateAll((pieces) => pieces.map((piece) => getComputedStyle(piece).transform));
    expect(scales.every((value) => value === 'none' || value === 'matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
  });

  test('reduced motion: not pinned, shows the page, all steps readable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    await page.locator('.build').scrollIntoViewIfNeeded();
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('.build .p-page')).toHaveAttribute('style', /left: 2%; top: 2%; width: 96%; height: 96%/);
    for (let index = 0; index < 4; index++) {
      await expect(steps(page).nth(index)).toBeVisible();
      await expect(steps(page).nth(index).locator('small')).toBeVisible();
    }
    await expect(page.locator('.build .p-accent .label')).toHaveCSS('opacity', '1');
    await steps(page).nth(0).click();
    await expect(page.locator('.build .p-page')).toHaveAttribute('style', /(?:^|[;s])left: 68%/);
    await expect(steps(page).nth(0)).toHaveAttribute('aria-current', 'step');
  });

  test('no horizontal overflow', async ({ page }) => {
    await page.goto('./');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
