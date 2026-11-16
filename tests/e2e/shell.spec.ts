import { expect, test, type Page } from '@playwright/test';

const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu' });
const menu = (page: Page) => page.locator('#site-menu');

test('theme switch flips the emulated scheme, updates aria-checked and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  const toggle = page.getByRole('switch', { name: 'Dark mode' });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
});

test('header controls are named by their visible text first (WCAG 2.5.3)', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('link', { name: 'Łukasz Moszczyński, home', exact: true })).toHaveCount(1);
  await expect(page.getByRole('link', { name: /^PL – / })).toHaveCount(1);
  await expect(page.getByRole('switch', { name: 'Dark mode' })).toHaveCount(1);
  await expect(menuButton(page)).toHaveAttribute('aria-controls', 'site-menu');
});

test.describe('wordmark', () => {
  for (const width of [360, 390, 480, 481, 560, 561, 768, 1440]) {
    test(`shows the name at ${width}px without touching the header tools`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('./');
      const logo = page.locator('header .logo');
      await expect(logo).toHaveAccessibleName('Łukasz Moszczyński, home');
      await expect(logo).toHaveCSS('font-weight', '600');
      await expect(logo).toHaveCSS('text-transform', 'none');
      const visible = width <= 480 ? 'Łukasz M.' : 'Łukasz Moszczyński';
      await expect(logo.getByText(visible, { exact: true })).toBeVisible();
      await expect(logo).toHaveCSS('font-size', width <= 560 ? '15px' : '16px');
      // The glyphs themselves (a range), not the box, which could shrink and let the text overflow.
      const text = await logo.locator(width <= 480 ? '.logo-short' : '.logo-full').evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const box = range.getBoundingClientRect();
        return { left: box.left, right: box.right, overflow: element.closest('.logo')!.scrollWidth - element.closest<HTMLElement>('.logo')!.clientWidth };
      });
      const tools = (await page.locator('header .bar-tools').boundingBox())!;
      expect(text.left).toBeGreaterThanOrEqual(0);
      expect(text.right).toBeLessThanOrEqual(tools.x - 8);
      expect(text.overflow).toBeLessThanOrEqual(0);
      expect(tools.x + tools.width).toBeLessThanOrEqual(width);
    });
  }

  test('the 404 page carries the same wordmark', async ({ page }) => {
    await page.goto('this-page-does-not-exist/');
    await expect(page.getByRole('link', { name: 'Łukasz Moszczyński, home', exact: true })).toHaveCount(1);
  });

  test('hover and keyboard focus draw the underline and colour the name', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover needs a fine pointer');
    await page.goto('./');
    const logo = page.locator('header .logo');
    const line = () => logo.locator('.logo-text').evaluate((element) => getComputedStyle(element, '::after').transform);
    expect(await line()).toBe('matrix(0, 0, 0, 1, 0, 0)');
    await logo.hover();
    await expect.poll(line).toBe('matrix(1, 0, 0, 1, 0, 0)');
    await page.mouse.move(700, 600);
    await expect.poll(line).toBe('matrix(0, 0, 0, 1, 0, 0)');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(logo).toBeFocused();
    await expect.poll(line).toBe('matrix(1, 0, 0, 1, 0, 0)');
  });
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

test('language switch keeps the page: a case study opens in the other language', async ({ page }) => {
  await page.goto('work/dcc/');
  await page.getByRole('link', { name: 'Zmień język na polski' }).click();
  await expect(page).toHaveURL(/\/portfolio-preview\/pl\/work\/dcc\/$/);
  await page.getByRole('link', { name: 'Switch language to English' }).click();
  await expect(page).toHaveURL(/\/portfolio-preview\/work\/dcc\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test.describe('whole-pill switches', () => {
  // Points across the pill: left edge, the current (orange) half, the middle, the other half, right edge.
  const spots = [0.03, 0.25, 0.5, 0.75, 0.97];

  for (const spot of spots) {
    test(`clicking the language pill at ${Math.round(spot * 100)}% switches EN → PL and back`, async ({ page }) => {
      await page.goto('./');
      const pill = page.locator('header [data-lang-switch]');
      const box = (await pill.boundingBox())!;
      await page.mouse.click(box.x + box.width * spot, box.y + box.height / 2);
      await expect(page).toHaveURL(/\/portfolio-preview\/pl\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
      await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition', /.*/);
      const back = (await page.locator('header [data-lang-switch]').boundingBox())!;
      await page.mouse.click(back.x + back.width * spot, back.y + back.height / 2);
      await expect(page).toHaveURL(/\/portfolio-preview\/$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });

    test(`clicking the theme pill at ${Math.round(spot * 100)}% toggles the theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto('./');
      const toggle = page.getByRole('switch', { name: 'Dark mode' });
      const box = (await toggle.boundingBox())!;
      await page.mouse.click(box.x + box.width * spot, box.y + box.height / 2);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await page.mouse.click(box.x + box.width * spot, box.y + box.height / 2);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });
  }

  test('the language pill is one link holding both labels, with the other language as its target', async ({ page }) => {
    await page.goto('./');
    const pill = page.locator('header .lang-seg');
    await expect(pill).toHaveJSProperty('tagName', 'A');
    await expect(pill).toHaveAttribute('hreflang', 'pl');
    await expect(pill).toHaveAttribute('lang', 'pl');
    await expect(pill).toHaveAccessibleName('PL – Zmień język na polski');
    await expect(pill.locator('.seg-option')).toHaveText(['EN', 'PL']);
    await expect(page.locator('header a[hreflang]')).toHaveCount(1);
  });

  test('the menu holds no extra copies of the switches', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('#site-menu [data-lang-switch], #site-menu [data-theme-toggle]')).toHaveCount(0);
  });

  test.describe('no JS', () => {
    test.use({ javaScriptEnabled: false });
    test('clicking the current-language half still follows the link', async ({ page }) => {
      await page.goto('./');
      await page.locator('header .lang-seg .is-current').click();
      await expect(page).toHaveURL(/\/portfolio-preview\/pl\/$/);
    });
  });
});

test('header links resolve under the base path', async ({ page }) => {
  await page.goto('./');
  const hrefs = await page.locator('header a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(2);
  for (const href of hrefs) expect(href).toMatch(/^\/portfolio-preview\//);
});

test.describe('menu', () => {
  test('opens and closes by click and by Escape, returning focus to the button', async ({ page }) => {
    await page.goto('./');
    const button = menuButton(page);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(menu(page)).toBeHidden();

    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(menu(page)).toBeVisible();
    await expect(menu(page).getByRole('link', { name: 'All work' })).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/\bmenu-open\b/);
    // Focus moves into the menu and stays trapped there.
    await expect(menu(page).locator('a').first()).toBeFocused();
    for (let step = 0; step < 15; step++) await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('header')));
    expect(inside).toBe(true);

    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(menu(page)).toBeHidden();
    await expect(button).toBeFocused();

    await button.click();
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu(page)).toBeHidden();
    await expect(button).toBeFocused();
    await expect(page.locator('html')).not.toHaveClass(/\bmenu-open\b/);
  });

  test('a link navigates and the menu is closed on the new page', async ({ page }) => {
    await page.goto('./');
    await menuButton(page).click();
    await menu(page).getByRole('link', { name: 'All work' }).click();
    await expect(page).toHaveURL(/\/portfolio-preview\/work\/$/);
    await expect(menu(page)).toBeHidden();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('html')).not.toHaveClass(/\bmenu-open\b/);
  });

  test('a same-page link closes the menu and scrolls to its section', async ({ page }) => {
    await page.goto('./');
    await menuButton(page).click();
    await menu(page).getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(menu(page)).toBeHidden();
    await expect(page).toHaveURL(/#contact$/);
    // Contact is the last section, so at the page end its top can stay a little below the header.
    await expect.poll(() => page.locator('#contact').evaluate((element) => element.getBoundingClientRect().top / window.innerHeight), { timeout: 5000 })
      .toBeLessThan(0.35);
    await expect(page.locator('#contact h2')).toBeInViewport();
  });

  test('no horizontal overflow with the menu closed or open', async ({ page }) => {
    await page.goto('./');
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);
    await menuButton(page).click();
    await expect(menu(page)).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(0);
    const box = (await page.locator('header .bar-tools').boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
});

test('robots.txt points at the sitemap under the base path', async ({ request }) => {
  const response = await request.get('robots.txt');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toMatch(/^Sitemap: https:\/\/lukaszmoszczynski\.github\.io\/portfolio-preview\/sitemap-index\.xml$/m);
});

test.describe('theme switch after many language switches', () => {
  const settled = (page: Page) => expect(page.locator('html')).not.toHaveAttribute('data-astro-transition', /.*/);

  for (const count of [10, 11]) {
    test(`after ${count} language switches one click flips the theme and a second flips it back`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto('./');
      for (let index = 0; index < count; index++) {
        const lang = await page.locator('html').getAttribute('lang');
        await page.locator('header [data-lang-switch]').click();
        await expect(page.locator('html')).not.toHaveAttribute('lang', lang!);
        await settled(page);
      }
      await expect(page.locator('html')).toHaveAttribute('lang', count % 2 ? 'pl' : 'en');
      const html = page.locator('html');
      const toggle = page.locator('header [data-theme-toggle]');
      await toggle.click();
      await expect(html).toHaveAttribute('data-theme', 'dark');
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
      await toggle.click();
      await expect(html).toHaveAttribute('data-theme', 'light');
      await expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  }

  test('a theme click while the page transition plays is not lost', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./');
    const html = page.locator('html');
    const theme = (await page.locator('header [data-theme-toggle]').boundingBox())!;
    await page.locator('header [data-lang-switch]').click();
    // The browser hit-tests to <html> while a view transition plays; click right then.
    await expect(html).toHaveAttribute('data-astro-transition', /.+/);
    await page.mouse.click(theme.x + theme.width / 2, theme.y + theme.height / 2);
    await settled(page);
    await expect(html).toHaveAttribute('lang', 'pl');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('header [data-theme-toggle]')).toHaveAttribute('aria-checked', 'true');
  });

  test('a second click on the language pill while its thumb slides does not queue a second switch', async ({ page }) => {
    await page.goto('./');
    const historyBefore = await page.evaluate(() => history.length);
    const pill = page.locator('header [data-lang-switch]');
    const box = (await pill.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(/\/portfolio-preview\/pl\/$/);
    await settled(page);
    await page.waitForTimeout(600);
    await expect(page).toHaveURL(/\/portfolio-preview\/pl\/$/);
    expect(await page.evaluate(() => history.length)).toBe(historyBefore + 1);
  });

  test('the language switch is a client-side navigation, not a full page load', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => ((window as Window & { stayMarker?: number }).stayMarker = 1));
    await page.locator('header [data-lang-switch]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
    await settled(page);
    expect(await page.evaluate(() => (window as Window & { stayMarker?: number }).stayMarker)).toBe(1);
  });
});

test.describe('inline text link underline', () => {
  test('one line: the hover line takes the resting line’s place instead of appearing below it', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover needs a fine pointer');
    await page.goto('./');
    const link = page.locator('#stack .text-link').first();
    await link.scrollIntoViewIfNeeded();
    const look = () => link.evaluate((element) => {
      const style = getComputedStyle(element);
      return { decoration: style.textDecorationLine, size: style.backgroundSize, position: style.backgroundPosition };
    });
    const rest = await look();
    expect(rest.decoration).toBe('none');
    expect(rest.size).toBe('0% 2px, 100% 2px');
    // Both layers sit at the same spot (bottom of the link).
    expect(rest.position).toBe('0px 100%, 0px 100%');
    await link.hover();
    await expect.poll(async () => (await look()).size).toBe('100% 2px, 100% 2px');
    expect((await look()).decoration).toBe('none');
  });
});
