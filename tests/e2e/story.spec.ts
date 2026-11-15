import { expect, test } from '@playwright/test';
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
    await page.waitForTimeout(800);
    const opacities = await statement.locator('.word').evaluateAll((nodes) => nodes.map((node) => Number(getComputedStyle(node).opacity)));
    expect(opacities.every((value) => value > 0.99)).toBe(true);
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
