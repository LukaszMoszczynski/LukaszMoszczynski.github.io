import { expect, test, type Page } from '@playwright/test';

const COUNT = 6;

/** How the focused card sits: inside the viewport below the header, nothing on top of it, its ring. */
const focusedCard = (page: Page) =>
  page.evaluate(() => {
    const active = document.activeElement as HTMLElement;
    const card = active.closest<HTMLElement>('.project-card');
    if (!card) return null;
    const cards = [...document.querySelectorAll<HTMLElement>('#work .project-card')];
    const box = card.getBoundingClientRect();
    // Any later card (painted above it) overlapping the focused card?
    const covered = cards.slice(cards.indexOf(card) + 1).some((other) => {
      const otherBox = other.getBoundingClientRect();
      return otherBox.top < box.bottom - 1 && otherBox.bottom > box.top + 1;
    });
    // And at the centre of its copy and visual, the card itself is what is hit.
    const hits = [...card.children].every((child) => {
      const part = child.getBoundingClientRect();
      const hit = document.elementFromPoint(part.left + part.width / 2, part.top + part.height / 2);
      return Boolean(hit && card.contains(hit));
    });
    const style = getComputedStyle(card);
    return {
      index: cards.indexOf(card),
      top: box.top,
      bottom: box.bottom,
      viewport: window.innerHeight,
      covered,
      hits,
      outline: `${style.outlineStyle} ${style.outlineWidth}`,
      outlineColor: style.outlineColor,
      copyOpacity: Number(getComputedStyle(card.firstElementChild!).opacity),
    };
  });

const accentColor = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--focus-ring)';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });

async function expectWholeAndRinged(page: Page, index: number) {
  await expect.poll(async () => (await focusedCard(page))?.index).toBe(index);
  // The scroll is instant, but give the scrubbed stack a frame to follow.
  await expect.poll(async () => {
    const card = (await focusedCard(page))!;
    return card.top >= 80 && card.bottom <= card.viewport && !card.covered && card.hits;
  }).toBe(true);
  const card = (await focusedCard(page))!;
  expect(card.outline).toBe('solid 3px');
  expect(card.outlineColor).toBe(await accentColor(page));
  expect(card.copyOpacity).toBe(1);
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test.describe(`selected work by keyboard (motion: ${reducedMotion})`, () => {
    test.use({ reducedMotion });

    test('Tab forward goes card by card, each whole, uncovered and ringed', async ({ page }) => {
      await page.goto('./');
      await page.locator('.deck').scrollIntoViewIfNeeded();
      await page.locator('.deck').focus();
      for (let index = 0; index < COUNT; index++) {
        await page.keyboard.press('Tab');
        await expectWholeAndRinged(page, index);
      }
      // After the cards: the "All work" link under the stack, then Contact.
      await page.keyboard.press('Tab');
      await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('#work .work-all')))).toBe(true);
      await expect(page.locator('#work .work-all a')).toBeInViewport();
      await page.keyboard.press('Tab');
      await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('#contact')))).toBe(true);
    });

    test('Shift+Tab backward from Contact never lands on a covered card', async ({ page }) => {
      await page.goto('./');
      await page.locator('#contact a').first().focus();
      await page.keyboard.press('Shift+Tab');
      await expect(page.locator('#work .work-all a')).toBeFocused();
      await expect(page.locator('#work .work-all a')).toBeInViewport();
      for (let index = COUNT - 1; index >= 0; index--) {
        await page.keyboard.press('Shift+Tab');
        await expectWholeAndRinged(page, index);
      }
    });
  });
}

test('the ring uses the accent in the dark theme too', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('./');
  await page.locator('#work .work-all a').focus();
  await page.keyboard.press('Shift+Tab');
  await expectWholeAndRinged(page, COUNT - 1);
});

test('Enter on a focused card opens its case study', async ({ page }) => {
  await page.goto('./');
  await page.locator('#work .work-all a').focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expectWholeAndRinged(page, COUNT - 2);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/portfolio-preview\/work\/wp-starter\/$/);
});

