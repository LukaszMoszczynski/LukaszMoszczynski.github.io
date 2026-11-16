import { expect, test, type Page } from '@playwright/test';
import { langSwitch } from './helpers';

/** Where `selector` sits relative to the viewport top, as a fraction of its own height (0 = its top at the viewport top). */
const offsetInto = (page: Page, selector: string) =>
  page.locator(selector).evaluate((element) => {
    const box = element.getBoundingClientRect();
    return -box.top / box.height;
  });

const settled = (page: Page) => expect(page.locator('html')).not.toHaveAttribute('data-astro-transition', /.*/);

/** Scroll so the viewport top is `fraction` of the way into `selector`. */
async function scrollInto(page: Page, selector: string, fraction: number) {
  await page.locator(selector).evaluate((element, into) => {
    const box = element.getBoundingClientRect();
    window.scrollTo({ top: box.top + window.scrollY + box.height * into, behavior: 'instant' });
  }, fraction);
}

async function switchLanguage(page: Page) {
  await (await langSwitch(page)).click();
}

test.describe('language switch keeps the reader’s place', () => {
  test('home: the Stack section stays at the top, EN → PL → EN', async ({ page }) => {
    await page.goto('./');
    await scrollInto(page, '#stack', 0.3);
    await switchLanguage(page);
    await expect(page).toHaveURL(/\/portfolio-preview\/pl\/$/);
    await settled(page);
    await expect.poll(() => offsetInto(page, '#stack')).toBeGreaterThan(0.2);
    expect(await offsetInto(page, '#stack')).toBeLessThan(0.4);

    await switchLanguage(page);
    await expect(page).toHaveURL(/\/portfolio-preview\/$/);
    await settled(page);
    await expect.poll(() => offsetInto(page, '#stack')).toBeGreaterThan(0.2);
    expect(await offsetInto(page, '#stack')).toBeLessThan(0.4);
  });

  test('home: Contact stays in view', async ({ page }) => {
    await page.goto('./');
    await page.locator('#contact').evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await switchLanguage(page);
    await expect(page).toHaveURL(/\/portfolio-preview\/pl\/$/);
    await settled(page);
    await expect(page.locator('#contact h2')).toBeInViewport();
    expect(await page.locator('#contact').evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(page.viewportSize()!.height * 0.4);
  });

  test('case study: the same prose section is at the top even though heading ids are translated', async ({ page }) => {
    await page.goto('work/dcc/');
    const headings = '.case-prose h2[id]';
    const heading = page.locator(headings).nth(1);
    await heading.evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'start' }));
    const englishTop = await heading.evaluate((element) => element.getBoundingClientRect().top);
    await switchLanguage(page);
    await expect(page).toHaveURL(/\/portfolio-preview\/pl\/work\/dcc\/$/);
    await settled(page);
    await expect.poll(() => page.locator(headings).nth(1).evaluate((element, top) => Math.abs(element.getBoundingClientRect().top - top), englishTop)).toBeLessThan(40);
    await expect(page).not.toHaveURL(/#/);
  });

  test('no hash is added; a plain link afterwards opens at the top; Back returns to the saved position', async ({ page }) => {
    await page.goto('./');
    await scrollInto(page, '#work', 0.1);
    const englishY = await page.evaluate(() => window.scrollY);
    await switchLanguage(page);
    await expect(page).toHaveURL(/\/portfolio-preview\/pl\/$/);
    await settled(page);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);

    await page.goto('pl/work/');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.goto('./');
    await scrollInto(page, '#work', 0.1);
    await switchLanguage(page);
    await expect(page).toHaveURL(/\/portfolio-preview\/pl\/$/);
    await settled(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/portfolio-preview\/$/);
    await settled(page);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(englishY - 40);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(englishY + 40);
  });

  test('a place older than ten seconds is ignored', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => sessionStorage.setItem('reading-place', JSON.stringify({
      path: new URL('pl/', location.href).pathname, id: 'contact', index: 6, count: 7, fraction: 0, pageFraction: 0.9, time: Date.now() - 11_000,
    })));
    await page.goto('pl/');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('works on a full page load too (the switch recorded, then the browser loads the page)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    await scrollInto(page, '#stack', 0.3);
    // Stop the router from navigating, so the next page is a full load.
    await page.evaluate(() => window.addEventListener('click', (event) => event.preventDefault(), { capture: true, once: true }));
    await switchLanguage(page);
    await page.goto('pl/');
    await expect.poll(() => offsetInto(page, '#stack')).toBeGreaterThan(0.2);
    expect(await offsetInto(page, '#stack')).toBeLessThan(0.4);
  });
});
