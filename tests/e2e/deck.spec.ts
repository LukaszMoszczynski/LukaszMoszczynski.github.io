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
    await page.waitForTimeout(1200);
    expect(await topName(page)).toBe(names[0]);
  });

  test('Next advances with the keyboard and cycles back', async ({ page }) => {
    await page.goto('./');
    const next = page.getByRole('button', { name: /next/i });
    await next.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => topName(page)).toBe(names[1]);
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
    });
  });
});
