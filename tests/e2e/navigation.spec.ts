import { expect, test, type Page } from '@playwright/test';

/** Waits until the ClientRouter has finished its view transition and the sections have set up. */
async function settled(page: Page) {
  await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition', /.*/);
  await expect(page.locator('html')).not.toHaveClass(/\binit-pending\b/);
}

/**
 * Where the section starts in the viewport. When the page cannot scroll any
 * further (the last section is shorter than the viewport) it counts as 0.
 */
const topOf = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((element) => {
    const top = Math.round(element.getBoundingClientRect().top);
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    return atBottom && top > 0 && top < window.innerHeight ? 0 : top;
  });

/** The section starts at the top of the viewport (its scroll margin included). */
async function expectAtTop(page: Page, selector: string) {
  await expect.poll(() => topOf(page, selector), { message: `${selector} at the top` }).toBeGreaterThanOrEqual(-8);
  await expect.poll(() => topOf(page, selector), { message: `${selector} at the top` }).toBeLessThanOrEqual(80);
}

test.describe('scroll position after navigation', () => {
  test('menu Contact on a case study lands on #contact', async ({ page }) => {
    await page.goto('work/dcc/');
    await settled(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator('#site-menu').getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page).toHaveURL(/\/#contact$/);
    await settled(page);
    await expectAtTop(page, '#contact');
  });

  test('“← All work” lands on #work', async ({ page }) => {
    await page.goto('work/dcc/');
    await settled(page);
    await page.getByRole('link', { name: '← All work' }).click();
    await expect(page).toHaveURL(/\/#work$/);
    await settled(page);
    await expectAtTop(page, '#work');
  });

  test('a direct load of /#contact shows the contact section', async ({ page }) => {
    await page.goto('./#contact');
    await settled(page);
    await expectAtTop(page, '#contact');
  });

  test('Back from a case study returns to the card', async ({ page }) => {
    await page.goto('./');
    await settled(page);
    const card = page.locator('#work .project-card').nth(2);
    await card.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    // Astro saves the position on scrollend; give it that event before leaving.
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300)));
    const before = await card.evaluate((element) => Math.round(element.getBoundingClientRect().top));
    await card.locator('a.project-link').click();
    await expect(page).toHaveURL(/\/work\/design-system\/$/);
    await settled(page);
    await page.goBack();
    await expect(page.locator('#work')).toHaveCount(1);
    await settled(page);
    await expect.poll(async () => Math.abs((await card.evaluate((element) => element.getBoundingClientRect().top)) - before)).toBeLessThanOrEqual(80);
  });
});

test.describe('scroll position after navigation, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('“← All work” lands on #work', async ({ page }) => {
    await page.goto('work/dcc/');
    await settled(page);
    await page.getByRole('link', { name: '← All work' }).click();
    await expect(page).toHaveURL(/\/#work$/);
    await settled(page);
    await expectAtTop(page, '#work');
  });
});

test.describe('first paint', () => {
  test('motion: the name and the deck start in their animation start state', async ({ page }) => {
    // Hold the bundled scripts back, so the pre-init state can be inspected.
    await page.route(/\/_astro\/.*\.js$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto('./', { waitUntil: 'commit' });
    await expect(page.locator('html')).toHaveClass(/\bmotion\b/);
    await expect(page.locator('html')).toHaveClass(/\binit-pending\b/);
    const charTransform = await page.locator('.hero .char').first().evaluate((element) => getComputedStyle(element).transform);
    expect(charTransform).not.toBe('none');
    await expect(page.locator('#recommendations .quote').nth(1)).toHaveCSS('grid-area', '1 / 1');
    await settled(page);
    await expect(page.locator('#recommendations')).toHaveClass(/\bdeck-on\b/);
  });

  test('if the scripts never run, the start state is released after ~3 s', async ({ page }) => {
    await page.route(/\/_astro\/.*\.js$/, (route) => route.abort());
    await page.goto('./', { waitUntil: 'commit' });
    await expect(page.locator('html')).toHaveClass(/\binit-pending\b/);
    await expect(page.locator('html')).not.toHaveClass(/\binit-pending\b/, { timeout: 5000 });
    await expect(page.locator('.hero .char').first()).toHaveCSS('transform', 'none');
    await expect(page.locator('.hero .claim')).toHaveCSS('opacity', '1');
    await expect(page.locator('#recommendations .quote').nth(1)).not.toHaveCSS('grid-area', '1 / 1');
  });

  test('reduced motion: nothing is held in a start state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./', { waitUntil: 'commit' });
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
    await expect(page.locator('.hero .char').first()).toHaveCSS('transform', 'none');
  });
});
