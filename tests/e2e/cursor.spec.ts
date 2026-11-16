import { expect, test, type Page } from '@playwright/test';

const ringPosition = (page: Page) =>
  page.locator('.cursor-ring').evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return { x: Math.round(matrix.m41), y: Math.round(matrix.m42) };
  });
const dotPosition = (page: Page) =>
  page.locator('.cursor-dot').evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return { x: Math.round(matrix.m41), y: Math.round(matrix.m42) };
  });

test.describe('custom cursor, fine pointer', () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop', 'needs a fine pointer'));

  test('runs, hides the native cursor and follows the mouse: dot at once, ring with a short lag', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('html')).toHaveClass(/\bhas-cursor\b/);
    const cursor = page.locator('.cursor');
    await expect(cursor).toHaveAttribute('aria-hidden', 'true');
    await expect(cursor).toHaveCSS('pointer-events', 'none');
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).cursor)).toBe('none');
    await page.mouse.move(400, 500);
    await page.mouse.move(700, 600, { steps: 4 });
    await expect(cursor).toHaveClass(/\bis-visible\b/);
    await expect.poll(() => dotPosition(page)).toEqual({ x: 700, y: 600 });
    await expect.poll(() => ringPosition(page)).toEqual({ x: 700, y: 600 });
  });

  test('grows over a link and becomes an “Open” pill over a project card', async ({ page }) => {
    await page.goto('./');
    const cursor = page.locator('.cursor');
    await page.locator('header .logo').hover();
    await expect(cursor).toHaveAttribute('data-state', 'link');
    const card = page.locator('#work .project-card').first();
    await card.scrollIntoViewIfNeeded();
    await card.locator('h3').hover();
    await expect(cursor).toHaveAttribute('data-state', 'open');
    await expect(page.locator('.cursor-label')).toHaveText('Open');
  });

  test('“Drag” over the deck, “Otwórz” on Polish pages, and the state survives a page change', async ({ page }) => {
    await page.goto('pl/');
    const cursor = page.locator('.cursor');
    const deck = page.locator('.reco .quote').first();
    await deck.scrollIntoViewIfNeeded();
    await deck.hover();
    await expect(cursor).toHaveAttribute('data-state', 'drag');
    await expect(page.locator('.cursor-label')).toHaveText('Przeciągnij');
    await page.goto('pl/work/');
    await page.locator('.work-index-card h2').first().hover();
    await expect(page.locator('.cursor-label')).toHaveText('Otwórz');
    // Client-side navigation keeps one cursor and the class on <html>.
    await page.locator('.work-index-card h2 a').first().click();
    await expect(page).toHaveURL(/\/pl\/work\/qa-agent\/$/);
    await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition', /.*/);
    await expect(page.locator('html')).toHaveClass(/\bhas-cursor\b/);
    await expect(page.locator('.cursor')).toHaveCount(1);
  });

  test('a click on a home card body opens its case study', async ({ page }) => {
    await page.goto('./');
    const card = page.locator('#work .project-card').first();
    await card.scrollIntoViewIfNeeded();
    await card.locator('h3').click();
    await expect(page).toHaveURL(/\/work\/qa-agent\/$/);
  });

  test('pressing shrinks the ring and leaving the window hides it', async ({ page }) => {
    await page.goto('./');
    const cursor = page.locator('.cursor');
    await page.mouse.move(700, 600);
    await page.mouse.down();
    await expect(cursor).toHaveClass(/\bis-pressed\b/);
    await page.mouse.up();
    await expect(cursor).not.toHaveClass(/\bis-pressed\b/);
    await page.locator('html').dispatchEvent('pointerleave');
    await expect(cursor).not.toHaveClass(/\bis-visible\b/);
  });
});

test.describe('custom cursor, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('is not added and the native cursor stays', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('html')).not.toHaveClass(/\bhas-cursor\b/);
    await expect(page.locator('.cursor')).toBeHidden();
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).cursor)).toBe('auto');
  });
});

test('no custom cursor on a touch phone', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'phone project only');
  await page.goto('./');
  await expect(page.locator('html')).not.toHaveClass(/\bhas-cursor\b/);
  await expect(page.locator('.cursor')).toBeHidden();
});

test.describe('custom cursor, no JS', () => {
  test.use({ javaScriptEnabled: false });
  test('the native cursor stays', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('html')).not.toHaveClass(/\bhas-cursor\b/);
    await expect(page.locator('.cursor')).toBeHidden();
  });
});
