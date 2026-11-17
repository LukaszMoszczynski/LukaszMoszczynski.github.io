import { expect, test, type Page } from '@playwright/test';
import { useTheme } from './helpers';
import { ui } from '../../src/i18n/ui';

const statementText = ui.en['statement.text'];

test.describe('statement and career path', () => {
  test('statement splits into words that join to the dictionary text and all light up', async ({ page }) => {
    await page.goto('./');
    const statement = page.locator('.statement p');
    await expect(statement.locator('.word').first()).toBeAttached();
    const words = await statement.locator('.word').allTextContents();
    expect(words.join(' ')).toBe(statementText);
    await statement.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const box = document.querySelector('.statement')!.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + box.bottom - window.innerHeight * 0.2);
    });
    // Scrubbed by scroll, or (when it was on screen at load) lit by the load-time entrance: either way all words end lit.
    await expect.poll(
      () => statement.locator('.word').evaluateAll((nodes) => nodes.every((node) => Number(getComputedStyle(node).opacity) > 0.99)),
      { timeout: 5000 },
    ).toBe(true);
  });

  test('statement visible at load lights up without any scroll', async ({ page }) => {
    await page.goto('./');
    const statement = page.locator('.statement p');
    await expect(statement.locator('.word').first()).toBeAttached();
    const visible = await statement.evaluate((node) => node.getBoundingClientRect().top < window.innerHeight * 0.98);
    test.skip(!visible, 'statement starts below the fold at this viewport');
    await expect.poll(
      () => statement.locator('.word').evaluateAll((nodes) => nodes.every((node) => Number(getComputedStyle(node).opacity) > 0.99)),
      { timeout: 6000 },
    ).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  /** Lowest and highest word opacity right now. */
  const opacityRange = (page: Page) =>
    page.locator('.statement .word').evaluateAll((nodes) => {
      const values = nodes.map((node) => Number(getComputedStyle(node).opacity));
      return { min: Math.min(...values), max: Math.max(...values) };
    });

  test('the entrance on screen at load starts clearly muted and ends at full ink', async ({ page }) => {
    await page.goto('./');
    const statement = page.locator('.statement p');
    await expect(statement.locator('.word').first()).toBeAttached();
    const visible = await statement.evaluate((node) => node.getBoundingClientRect().top < window.innerHeight * 0.98);
    test.skip(!visible, 'statement starts below the fold at this viewport');
    // Clearly muted at the start (not the old, barely visible 0.65), and lit word by word.
    expect((await opacityRange(page)).min).toBeLessThan(0.3);
    await expect(page.locator('.statement')).toHaveAttribute('data-entrance', 'running');
    await expect.poll(async () => (await opacityRange(page)).min, { timeout: 4000 }).toBeGreaterThan(0.99);
    await expect(page.locator('.statement')).not.toHaveAttribute('data-entrance', /.*/);
  });

  test('below the fold the words are not dim off screen; the entrance plays on arrival and ends lit without more scrolling', async ({ page }) => {
    await page.goto('./');
    const statement = page.locator('.statement p');
    await expect(statement.locator('.word').first()).toBeAttached();
    const below = await statement.evaluate((node) => node.getBoundingClientRect().top >= window.innerHeight);
    test.skip(!below, 'statement is on screen at load at this viewport');
    await page.waitForTimeout(600);
    expect((await opacityRange(page)).min).toBe(1);
    // Bring its top just past the play line and stop there.
    await page.evaluate(() => {
      const box = document.querySelector('.statement p')!.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + box.top - window.innerHeight * 0.7, behavior: 'instant' });
    });
    await expect.poll(async () => (await opacityRange(page)).min, { timeout: 1500 }).toBeLessThan(0.5);
    await expect.poll(async () => (await opacityRange(page)).min, { timeout: 4000 }).toBeGreaterThan(0.99);
    await expect(page.locator('.statement')).not.toHaveAttribute('data-entrance', /.*/);
  });

  test('a reader who stops just short of the play line still gets the full text (fallback)', async ({ page }) => {
    await page.goto('./');
    const statement = page.locator('.statement p');
    await expect(statement.locator('.word').first()).toBeAttached();
    const below = await statement.evaluate((node) => node.getBoundingClientRect().top >= window.innerHeight);
    test.skip(!below, 'statement is on screen at load at this viewport');
    await page.evaluate(() => {
      const box = document.querySelector('.statement p')!.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + box.top - window.innerHeight * 0.08, behavior: 'instant' });
    });
    await expect(page.locator('.statement')).toHaveAttribute('data-entrance', 'running');
    await expect.poll(async () => (await opacityRange(page)).min, { timeout: 6000 }).toBeGreaterThan(0.99);
  });

  test('a stored Pause animations choice shows the final text at once', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('motion-paused', '1'));
    await page.goto('./');
    await expect(page.locator('.statement .word').first()).toBeAttached();
    expect((await opacityRange(page)).min).toBe(1);
    await expect(page.locator('.statement')).not.toHaveAttribute('data-entrance', /.*/);
    await page.evaluate(() => document.querySelector('.statement')!.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(300);
    expect((await opacityRange(page)).min).toBe(1);
  });

  test('switching Pause animations on mid-entrance shows the final text at once', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('.statement .word').first()).toBeAttached();
    await page.evaluate(() => document.querySelector('.statement')!.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(page.locator('.statement')).toHaveAttribute('data-entrance', 'running');
    const pause = page.locator('footer [data-motion-toggle]');
    await pause.evaluate((button: HTMLElement) => button.click());
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    expect((await opacityRange(page)).min).toBe(1);
    await expect(page.locator('.statement')).not.toHaveAttribute('data-entrance', /.*/);
  });

  test('timeline has 8 entries that all light up at the end', async ({ page }) => {
    await page.goto('./');
    const items = page.locator('.career .tl li');
    await expect(items).toHaveCount(8);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const list = document.querySelector('.career .tl')!.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + list.bottom - window.innerHeight * 0.4);
    });
    await page.waitForTimeout(800);
    for (const item of await items.all()) await expect(item).toHaveClass(/\blit\b/);
  });

  test('2017 entry links to the first portfolio, absolute, in both languages', async ({ page }) => {
    for (const [path, text] of [['./', 'my first portfolio'], ['pl/', 'moje pierwsze portfolio']]) {
      await page.goto(path);
      const link = page.locator('.career .tl li').nth(2).getByRole('link', { name: text });
      await expect(link).toHaveAttribute('href', 'https://lukaszmoszczynski.github.io/portfolio-2019/');
      await expect(link).not.toHaveAttribute('target', /.+/);
    }
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('plain statement and fully opaque entries', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('.statement p')).toHaveText(statementText);
    await expect(page.locator('.statement .word')).toHaveCount(0);
    for (const item of await page.locator('.career .tl li').all()) {
      expect(await item.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
    }
  });
});

test.describe('statement turns orange word by word as the reader scrolls past', () => {
  /** Scroll so the statement's top sits at `fraction` of the viewport height. */
  const placeTop = (page: Page, fraction: number) =>
    page.evaluate((share) => {
      const box = document.querySelector('.statement')!.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + box.top - window.innerHeight * share, behavior: 'instant' });
    }, fraction);
  /** Scroll so the statement's bottom sits at `fraction` of the viewport height. */
  const placeBottom = (page: Page, fraction: number) =>
    page.evaluate((share) => {
      const box = document.querySelector('.statement')!.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + box.bottom - window.innerHeight * share, behavior: 'instant' });
    }, fraction);
  const heat = (page: Page) =>
    page.locator('.statement .word').evaluateAll((nodes) => {
      const value = (node: Element) => Number(getComputedStyle(node).getPropertyValue('--heat') || 0);
      return { first: value(nodes[0]), last: value(nodes[nodes.length - 1]), colourFirst: getComputedStyle(nodes[0]).color, colourLast: getComputedStyle(nodes[nodes.length - 1]).color };
    });
  const resolved = (page: Page, variable: string) =>
    page.evaluate((name) => {
      const probe = document.createElement('i');
      probe.style.color = `color-mix(in srgb, var(${name}) 100%, var(--ink))`;
      document.querySelector('.statement')!.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    }, variable);

  for (const scheme of ['light', 'dark'] as const) {
    test(`ink before, first words orange midway, all orange after (${scheme})`, async ({ page }) => {
      await useTheme(page, scheme);
      await page.goto('./');
      await expect(page.locator('.statement .word').first()).toBeAttached();
      const ink = await resolved(page, '--ink');
      const accent = await resolved(page, '--accent-display');

      await placeTop(page, 0.75);
      await expect.poll(async () => (await heat(page)).first).toBe(0);
      expect((await heat(page)).colourFirst).toBe(ink);

      // Midway: the first word is further on than the last.
      await page.evaluate(() => {
        const box = document.querySelector('.statement')!.getBoundingClientRect();
        const start = window.scrollY + box.top - window.innerHeight * 0.6;
        const end = window.scrollY + box.bottom - window.innerHeight * 0.3;
        window.scrollTo({ top: (start + end) / 2, behavior: 'instant' });
      });
      await expect.poll(async () => (await heat(page)).first).toBeGreaterThan(0.5);
      const middle = await heat(page);
      expect(middle.last).toBeLessThan(middle.first);

      await placeBottom(page, 0.1);
      await expect.poll(async () => (await heat(page)).last).toBe(1);
      const end = await heat(page);
      expect(end.colourFirst).toBe(accent);
      expect(end.colourLast).toBe(accent);

      // And back up: ink again.
      await placeTop(page, 0.75);
      await expect.poll(async () => (await heat(page)).last).toBe(0);
      expect((await heat(page)).colourLast).toBe(ink);
    });
  }

  test('a page loaded already past it starts orange', async ({ page }) => {
    await page.goto('./#stack');
    await expect(page.locator('.statement .word').first()).toBeAttached();
    await expect.poll(async () => (await heat(page)).last).toBe(1);
  });

  test('reduced motion: no scrub, plain ink text', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    await expect(page.locator('.statement .word')).toHaveCount(0);
    await placeBottom(page, 0.1);
    const colours = await page.locator('.statement p').evaluate((element) => ({ text: getComputedStyle(element).color, ink: getComputedStyle(document.body).color }));
    expect(colours.text).toBe(colours.ink);
  });
});
