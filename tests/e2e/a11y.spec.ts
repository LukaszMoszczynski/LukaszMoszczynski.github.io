import { readdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** WCAG 2.2 AA audit with axe on every page, both themes, desktop and phone. */
const slugs = readdirSync('src/content/projects/en').map((file) => file.replace(/\.[^.]+$/, ''));
const pages = [
  './', 'pl/', 'work/', 'pl/work/',
  ...slugs.flatMap((slug) => [`work/${slug}/`, `pl/work/${slug}/`]),
  'missing/',
];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Scrolls through the whole page so every scroll-driven section reaches its final state. */
async function scrollThrough(page: Page) {
  const step = await page.evaluate(() => Math.round(window.innerHeight * 0.6));
  for (let top = 0; ; top += step) {
    const bottom = await page.evaluate((target) => {
      window.scrollTo({ top: target, behavior: 'instant' });
      return target + window.innerHeight >= document.documentElement.scrollHeight;
    }, top);
    await page.waitForTimeout(60);
    if (bottom) break;
  }
  // Let the last scrubs and reveals settle.
  await page.waitForTimeout(800);
}

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.slice(0, 6).map((node) => `${node.target.join(' ')} :: ${node.failureSummary?.split('\n').slice(1, 2).join('')}`),
  }));
}

for (const scheme of ['light', 'dark'] as const) {
  for (const path of pages) {
    test(`axe: no WCAG 2.2 AA violations on ${path} (${scheme})`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      await expect(page.locator('html')).not.toHaveClass(/init-pending/);
      // At rest at the top of the page (hero entrance done).
      await page.waitForTimeout(1800);
      expect(await audit(page), `${path} at the top`).toEqual([]);
      await scrollThrough(page);
      // The agent log replays forever and a line caught mid-fade is a passing frame, not a state.
      // "Pause animations" (footer) puts every looping animation at rest, which is what we audit.
      const pause = page.locator('footer [data-motion-toggle]');
      if (await pause.isVisible()) {
        await pause.click();
        await expect(pause).toHaveAttribute('aria-pressed', 'true');
        await page.waitForTimeout(300);
      }
      expect(await audit(page), `${path} after scrolling through`).toEqual([]);
    });
  }
}

test('axe: reduced motion pages have no violations either', async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['./', 'pl/', 'work/design-system/', 'work/delivery-loop/']) {
    await page.goto(path);
    await expect(page.locator('html')).not.toHaveClass(/init-pending/);
    expect(await audit(page), path).toEqual([]);
  }
});

for (const scheme of ['light', 'dark'] as const) {
  test(`axe: no violations with the cursor spotlight over text (${scheme})`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone', 'the spotlight follows a fine pointer');
    test.setTimeout(60_000);
    await page.addInitScript((theme) => localStorage.setItem('theme', theme), scheme);
    await page.goto('./');
    await expect(page.locator('html')).not.toHaveClass(/init-pending/);
    for (const selector of ['.hero .sub', '#stack .skill p', '#contact .contact-label']) {
      const target = page.locator(selector).first();
      await target.scrollIntoViewIfNeeded();
      const box = (await target.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
      await page.waitForTimeout(2200);
      expect(await audit(page), `${selector} under the spotlight`).toEqual([]);
    }
  });
}
