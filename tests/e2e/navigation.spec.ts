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

/** The section starts at the top of the viewport, below the fixed header (html scroll-padding-top: 88px). */
async function expectAtTop(page: Page, selector: string) {
  await expect.poll(() => topOf(page, selector), { message: `${selector} at the top` }).toBeGreaterThanOrEqual(-8);
  await expect.poll(() => topOf(page, selector), { message: `${selector} at the top` }).toBeLessThanOrEqual(96);
}

test.describe('scroll position after navigation', () => {
  test('menu Contact on a case study lands on #contact', async ({ page }) => {
    await page.goto('work/wordpress-shop/');
    await settled(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator('#site-menu').getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page).toHaveURL(/\/#contact$/);
    await settled(page);
    await expectAtTop(page, '#contact');
  });

  test('“← All work” opens the /work/ list', async ({ page }) => {
    await page.goto('work/wordpress-shop/');
    await settled(page);
    await page.getByRole('link', { name: '← All work' }).click();
    await expect(page).toHaveURL(/\/portfolio-preview\/work\/$/);
    await settled(page);
    await expect(page.locator('#work-index-title')).toBeInViewport();
  });

  test('“← Wszystkie projekty” on a Polish case opens /pl/work/', async ({ page }) => {
    await page.goto('pl/work/wordpress-shop/');
    await settled(page);
    await page.getByRole('link', { name: '← Wszystkie projekty' }).click();
    await expect(page).toHaveURL(/\/portfolio-preview\/pl\/work\/$/);
  });

  test('home Selected work links to the full /work/ list under the stack', async ({ page }) => {
    for (const [path, name, target] of [['./', 'All work →', /\/portfolio-preview\/work\/$/], ['pl/', 'Wszystkie projekty →', /\/portfolio-preview\/pl\/work\/$/]] as const) {
      await page.goto(path);
      await settled(page);
      const link = page.locator('#work .work-all').getByRole('link', { name });
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeVisible();
      const linkTop = (await link.boundingBox())!.y;
      const lastCard = (await page.locator('#work .project-card').last().boundingBox())!;
      expect(linkTop).toBeGreaterThan(lastCard.y);
      await link.click();
      await expect(page).toHaveURL(target);
    }
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
  test('“← All work” opens the /work/ list', async ({ page }) => {
    await page.goto('work/wordpress-shop/');
    await settled(page);
    await page.getByRole('link', { name: '← All work' }).click();
    await expect(page).toHaveURL(/\/portfolio-preview\/work\/$/);
    await settled(page);
    await expect(page.locator('#work-index-title')).toBeInViewport();
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

  test('the hero rise-in plays from the first paint, without waiting for the scripts', async ({ page }) => {
    let scriptsLoaded = 0;
    page.on('requestfinished', (request) => { if (/\/_astro\/.*\.js$/.test(request.url())) scriptsLoaded++; });
    await page.route(/\/_astro\/.*\.js$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      await route.continue().catch(() => {});
    });
    await page.goto('./', { waitUntil: 'commit' });
    // Moving, not just released: a letter caught between its start pose and rest while the
    // safety timer (3 s, it would snap everything to rest) still holds init-pending.
    const midway = await page.waitForFunction(() => {
      const char = document.querySelector<HTMLElement>('.hero .char');
      if (!char || !document.documentElement.classList.contains('init-pending')) return false;
      const lift = Math.abs(new DOMMatrix(getComputedStyle(char).transform).m42);
      return lift > 0.5 && lift < char.offsetHeight * 0.9;
    }, undefined, { polling: 16, timeout: 2800 });
    expect(await midway.jsonValue()).toBe(true);
    const last = page.locator('.hero .char').last();
    await expect.poll(() => last.evaluate((element) => getComputedStyle(element).transform), { timeout: 4000 }).toBe('none');
    await expect(page.locator('.hero .grid-hint')).toHaveCSS('opacity', '1', { timeout: 1000 });
    expect(scriptsLoaded).toBe(0);
  });

  test('Polish letters in the name use Unbounded from the small subset file', async ({ page }) => {
    const fonts: string[] = [];
    page.on('response', (response) => { if (response.url().endsWith('.woff2')) fonts.push(response.url()); });
    await page.goto('./');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('300 40px "Unbounded Variable"', 'ŁńąćęśźżŚŹŻ'))).toBe(true);
    expect(fonts.some((url) => /unbounded-polish-wght\.[\w-]+\.woff2$/.test(url))).toBe(true);
    expect(fonts.some((url) => url.includes('unbounded-latin-ext'))).toBe(false);
  });

  test('reduced motion: nothing is held in a start state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./', { waitUntil: 'commit' });
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
    await expect(page.locator('.hero .char').first()).toHaveCSS('transform', 'none');
  });
  test('with storage blocked, Pause animations survives a client-side page change', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError');
        },
      });
    });
    await page.goto('./');
    await settled(page);
    const pause = page.locator('footer [data-motion-toggle]');
    await pause.evaluate((button: HTMLElement) => button.click());
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#work a.project-link[href$="/work/wordpress-shop/"]').evaluate((link: HTMLElement) => link.click());
    await expect(page).toHaveURL(/\/work\/wordpress-shop\/$/);
    await settled(page);
    await expect(page.locator('html')).toHaveClass(/\bmotion-paused\b/);
    await expect(page.locator('footer [data-motion-toggle]')).toHaveAttribute('aria-pressed', 'true');
  });
});
