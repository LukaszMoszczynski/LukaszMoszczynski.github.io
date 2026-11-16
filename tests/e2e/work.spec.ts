import { expect, test } from '@playwright/test';

const SLUGS = ['dcc', 'design-system', 'qa-agent', 'delivery-loop', 'wp-starter', 'omelanski'];

test.describe('selected work', () => {
  for (const [path, prefix] of [['./', 'work/'], ['pl/', 'pl/work/']]) {
    test(`6 project cards link to their case studies (${path})`, async ({ page }) => {
      await page.goto(path);
      const cards = page.locator('#work article.project-card');
      await expect(cards).toHaveCount(6);
      for (const [index, slug] of SLUGS.entries()) {
        const href = await cards.nth(index).locator('a').first().getAttribute('href');
        expect(href).toMatch(new RegExp(`/portfolio-preview/${prefix}${slug}/$`));
      }
    });
  }

  test('home.pl cards carry the origin badge and the others do not', async ({ page }) => {
    await page.goto('./');
    const cards = page.locator('#work article.project-card');
    await expect(cards.nth(2).locator('.project-origin')).toHaveText('home.pl');
    await expect(cards.nth(3).locator('.project-origin')).toHaveText('home.pl');
    await expect(cards.locator('.project-origin')).toHaveCount(2);
  });

  test('section has no horizontal overflow', async ({ page }) => {
    await page.goto('./');
    await page.locator('#work').scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('last card is not covered and the section ends close to it', async ({ page }) => {
    await page.goto('./');
    const last = page.locator('#work article.project-card').last();
    await last.scrollIntoViewIfNeeded();
    const gap = await page.evaluate(() => {
      const section = document.querySelector('#work')!.getBoundingClientRect();
      const cards = document.querySelectorAll('#work .project-card');
      const card = cards[cards.length - 1].getBoundingClientRect();
      return section.bottom - card.bottom;
    });
    expect(gap).toBeLessThan(200);
    await expect(last).toBeInViewport();
  });

  test('earlier cards shrink and dim under the last one on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'cards stack only on wide screens');
    await page.goto('./');
    const cards = page.locator('#work .project-card');
    await cards.last().scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const list = document.querySelectorAll('#work .project-card');
      const last = list[list.length - 1].getBoundingClientRect();
      window.scrollBy(0, last.top - 168);
    });
    const copyOpacity = (index: number) =>
      cards.nth(index).locator('.project-copy').evaluate((node) => Number(getComputedStyle(node).opacity));
    await expect.poll(() => copyOpacity(0)).toBeLessThan(0.6);
    await expect.poll(() => cards.first().evaluate((node) => getComputedStyle(node).transform)).toMatch(/^matrix\(0\.9[12]/);
    expect(await cards.first().evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
    expect(await copyOpacity(5)).toBe(1);
  });

  test('hovering a visual tilts it on desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'tilt needs a fine pointer');
    await page.goto('./');
    const visual = page.locator('#work .project-card').first().locator('.project-visual');
    await visual.scrollIntoViewIfNeeded();
    const box = (await visual.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25);
    const screen = visual.locator('.project-screen');
    await expect.poll(() => screen.evaluate((node) => getComputedStyle(node).transform)).not.toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  });
});

test.describe('selected work, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('cards are fully opaque and unscaled', async ({ page }) => {
    await page.goto('./');
    const cards = page.locator('#work article.project-card');
    await expect(cards).toHaveCount(6);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    for (const card of await cards.all()) {
      expect(await card.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
      expect(await card.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
    }
  });
});
