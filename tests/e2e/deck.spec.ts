import { expect, test } from '@playwright/test';

const names = ['Aleksandra Zalewska', 'Szymon Papis', 'Dawid Krajewski'];

async function topName(page: import('@playwright/test').Page) {
  return page.locator('.quote:not([aria-hidden="true"]) figcaption b').textContent();
}

test.describe('recommendations deck', () => {
  test('top card is Aleksandra Zalewska and the deck is a labelled region', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('.deck')).toHaveAttribute('role', 'region');
    await expect(page.locator('.deck')).toHaveAttribute('aria-label', /.+/);
    await expect.poll(() => topName(page)).toBe(names[0]);
    await expect(page.locator('.quote[aria-hidden="true"]')).toHaveCount(2);
  });

  test('dragging the top card 200px right reveals Szymon Papis', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'mouse drag is a desktop interaction');
    await page.goto('./');
    const card = page.locator('.quote').first();
    await card.scrollIntoViewIfNeeded();
    const box = (await card.boundingBox())!;
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY, { steps: 5 });
    await page.mouse.move(startX + 200, startY, { steps: 5 });
    await page.mouse.up();
    await expect.poll(() => topName(page)).toBe(names[1]);
  });

  test('a 50px drag snaps back', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'mouse drag is a desktop interaction');
    await page.goto('./');
    const card = page.locator('.quote').first();
    await card.scrollIntoViewIfNeeded();
    const box = (await card.boundingBox())!;
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY, { steps: 5 });
    await page.mouse.up();
    await expect.poll(async () => Math.abs((await card.boundingBox())!.x - box.x), { timeout: 3000 }).toBeLessThan(1);
    expect(Math.abs((await card.boundingBox())!.y - box.y)).toBeLessThan(1);
    expect(await topName(page)).toBe(names[0]);
  });

  test('Next advances with the keyboard and cycles back', async ({ page }) => {
    await page.goto('./');
    const next = page.getByRole('button', { name: /next/i });
    await next.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => topName(page)).toBe(names[1]);
    await expect(page.locator('.deck-announce')).toContainText(names[1]);
    await expect(page.locator('.deck-announce')).toContainText('Szymon');
    await page.keyboard.press('Enter');
    await expect.poll(() => topName(page)).toBe(names[2]);
    await page.keyboard.press('Enter');
    await expect.poll(() => topName(page)).toBe(names[0]);
    expect((await next.boundingBox())!.height).toBeGreaterThanOrEqual(40);
  });

  test('Next still cycles under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    await page.getByRole('button', { name: /next/i }).click();
    await expect.poll(() => topName(page)).toBe(names[1]);
    await page.getByRole('button', { name: /previous/i }).click();
    await expect.poll(() => topName(page)).toBe(names[0]);
    await page.locator('.deck').focus();
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => topName(page)).toBe(names[2]);
    await expect(page.locator('.deck-announce')).toContainText('Recommendation 3 of 3');
    await expect(page.locator('.reco-hint')).not.toContainText(/drag/i);
    await expect(page.locator('.quote').first()).toHaveCSS('cursor', 'default');
  });

  test('Previous goes back and announces the position', async ({ page }) => {
    await page.goto('./');
    const previous = page.getByRole('button', { name: /previous/i });
    await previous.click();
    await expect.poll(() => topName(page)).toBe(names[2]);
    await expect(page.locator('.deck-announce')).toContainText('Recommendation 3 of 3');
    await expect(page.locator('.deck-announce')).toContainText(names[2]);
    await page.getByRole('button', { name: /next/i }).click();
    await expect.poll(() => topName(page)).toBe(names[0]);
    await expect(page.locator('.deck-announce')).toContainText('Recommendation 1 of 3');
    expect((await previous.boundingBox())!.height).toBeGreaterThanOrEqual(40);
  });

  test('keyboard: Tab reaches Previous, Next and the deck; arrows switch cards; only the top card is exposed', async ({ page }) => {
    await page.goto('./');
    const previous = page.getByRole('button', { name: /previous/i });
    const next = page.getByRole('button', { name: /next/i });
    const deck = page.getByRole('region', { name: 'LinkedIn recommendations' });
    await previous.focus();
    await page.keyboard.press('Tab');
    await expect(next).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(deck).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => topName(page)).toBe(names[1]);
    await expect(page.locator('.deck-announce')).toHaveText(/^Recommendation 2 of 3: Szymon Papis/);
    await expect(deck).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => topName(page)).toBe(names[0]);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => topName(page)).toBe(names[2]);

    // Arrows work on the buttons too, and focus stays put.
    await next.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => topName(page)).toBe(names[0]);
    await expect(next).toBeFocused();

    // Hidden cards are out of the tab order and the accessibility tree.
    await expect(page.locator('.quote[inert]')).toHaveCount(2);
    await expect(page.locator('.quote[aria-hidden="true"]')).toHaveCount(2);
    await expect(deck.getByRole('figure')).toHaveCount(1);
    await expect(deck).toContainText(names[0]);
    await expect(deck.getByRole('figure')).not.toContainText(names[1]);
  });

  for (const scheme of ['light', 'dark'] as const) {
    test(`focus rings on the buttons and the deck use the accent (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('./');
      const accent = await page.evaluate(() => {
        const probe = document.createElement('i');
        probe.style.color = 'var(--accent)';
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      });
      await page.getByRole('button', { name: /previous/i }).focus();
      for (const target of [page.getByRole('button', { name: /previous/i }), page.getByRole('button', { name: /next/i }), page.locator('.deck')]) {
        if (!(await target.evaluate((element) => element === document.activeElement))) await page.keyboard.press('Tab');
        await expect(target).toBeFocused();
        await expect(target).toHaveCSS('outline-style', 'solid');
        await expect(target).toHaveCSS('outline-width', '2px');
        await expect(target).toHaveCSS('outline-color', accent);
      }
    });
  }

  test('Dawid role matches the spec', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('.quote', { hasText: 'Dawid Krajewski' })).toContainText('Co-Founder @ Sherlo (formerly home.pl) · 2022');
  });

  test('quotes are identical in English on /pl/ and marked lang=en', async ({ page }) => {
    await page.goto('./');
    const english = await page.locator('.quote blockquote').allTextContents();
    await page.goto('pl/');
    expect(await page.locator('.quote blockquote').allTextContents()).toEqual(english);
    await expect(page.locator('.quote blockquote').first()).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('button', { name: /dalej/i })).toBeVisible();
  });

  test('longest quote fits at 360px without clipping or page scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('./');
    const fits = await page.evaluate(() => {
      const deck = document.querySelector<HTMLElement>('.deck')!;
      return [...document.querySelectorAll('.quote')].every((card) => {
        const element = card as HTMLElement;
        return element.scrollHeight <= element.offsetHeight + 1 && element.offsetWidth <= deck.offsetWidth + 1;
      });
    });
    expect(fits).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test.describe('no JS', () => {
    test.use({ javaScriptEnabled: false });
    test('all three quotes are readable', async ({ page }) => {
      await page.goto('./');
      for (const name of names) await expect(page.getByText(name)).toBeVisible();
      await expect(page.getByRole('button', { name: /next/i })).toBeHidden();
      await expect(page.getByRole('button', { name: /previous/i })).toBeHidden();
    });
  });
});
