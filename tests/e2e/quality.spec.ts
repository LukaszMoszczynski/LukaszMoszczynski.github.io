import { readdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const slugs = readdirSync('src/content/projects/en').map((file) => file.replace(/\.[^.]+$/, ''));
const pages = ['./', 'pl/', 'work/', 'pl/work/', ...slugs.flatMap((slug) => [`work/${slug}/`, `pl/work/${slug}/`])];
const hosts = new Set(['localhost:4321']);

test('there are six case studies and a work index in two languages', () => {
  expect(slugs).toHaveLength(6);
  expect(pages).toHaveLength(16);
});

test('every internal link and asset resolves under the base path', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'same markup as desktop; crawl runs once');
  test.setTimeout(120_000);
  const checked = new Set<string>();
  for (const path of [...pages, 'missing/']) {
    await page.goto(path);
    const urls = await page.evaluate(() => {
      const values: string[] = [];
      document.querySelectorAll('[href], [src]').forEach((element) => {
        const value = element.getAttribute('href') ?? element.getAttribute('src');
        if (value) values.push(value);
      });
      return values;
    });
    for (const value of urls) {
      if (value.startsWith('#') || /^(mailto|tel|data|blob|javascript):/.test(value)) continue;
      const url = new URL(value, page.url());
      if (!hosts.has(url.host)) continue; // absolute external links are out of scope
      if (/^https?:/.test(value)) continue;
      expect(url.pathname, `${path} -> ${value}`).toMatch(/^\/portfolio-preview\//);
      const key = url.pathname + url.search;
      if (checked.has(key)) continue;
      checked.add(key);
      const response = await request.get(url.href);
      expect(response.status(), `${path} -> ${value}`).toBe(200);
    }
  }
  expect(checked.size).toBeGreaterThan(20);
});

test('metadata is complete and unique on every page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'metadata does not depend on viewport');
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const head = await page.evaluate(() => {
      const attr = (selector: string, name: string) => document.querySelector(selector)?.getAttribute(name) ?? '';
      return {
        title: document.title,
        description: attr('meta[name="description"]', 'content'),
        image: attr('meta[property="og:image"]', 'content'),
        canonical: attr('link[rel="canonical"]', 'href'),
        hreflangs: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((element) => element.getAttribute('hreflang')),
        card: attr('meta[name="twitter:card"]', 'content'),
        icon: attr('link[rel="icon"]', 'href'),
      };
    });
    expect(head.title.length, path).toBeGreaterThan(5);
    expect(head.description.length, path).toBeGreaterThan(20);
    expect(titles.has(head.title), `duplicate title on ${path}`).toBe(false);
    expect(descriptions.has(head.description), `duplicate description on ${path}`).toBe(false);
    titles.add(head.title);
    descriptions.add(head.description);
    expect(head.image, path).toMatch(/^https:\/\/[^/]+\/.*og\.png$/);
    expect(head.canonical, path).toMatch(/^https:\/\//);
    expect(head.hreflangs.sort(), path).toEqual(['en', 'pl', 'x-default']);
    expect(head.card, path).toBe('summary_large_image');
    expect(head.icon, path).toMatch(/favicon\.svg$/);
  }
  const imageResponse = await page.request.get('og.png');
  expect(imageResponse.status()).toBe(200);
});

test('sitemap index lists URLs under the base path', async ({ request }) => {
  const index = await request.get('sitemap-index.xml');
  expect(index.status()).toBe(200);
  const indexText = await index.text();
  const sitemapUrl = /<loc>([^<]+sitemap-0\.xml)<\/loc>/.exec(indexText)?.[1] ?? '';
  expect(sitemapUrl).toContain('/portfolio-preview/');
  const sitemap = await request.get(new URL(sitemapUrl).pathname);
  const locs = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(locs.length).toBe(pages.length);
  for (const loc of locs) expect(loc).toContain('/portfolio-preview/');
});

test('no horizontal overflow and no console errors on any page', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const problems: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') problems.push(message.text()); });
  page.on('pageerror', (error) => problems.push(error.message));
  if (testInfo.project.name === 'desktop') await page.setViewportSize({ width: 360, height: 740 });
  for (const path of pages) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `overflow on ${path}`).toBeLessThanOrEqual(0);
  }
  expect(problems).toEqual([]);
});

async function hiddenText(page: Page) {
  return page.evaluate(() => {
    const hidden: string[] = [];
    document.querySelectorAll('main section').forEach((section) => {
      const targets = section.querySelectorAll('h1, h2, h3, p, blockquote, li');
      if (!targets.length) hidden.push(`${section.id || section.className}: no text`);
      targets.forEach((element) => {
        if (!element.textContent?.trim()) return;
        for (let node: Element | null = element; node && node !== document.body; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (style.display === 'none') return; // intentionally not rendered (e.g. replaced by a static equivalent)
          if (Number(style.opacity) === 0 || style.visibility === 'hidden') {
            hidden.push(`${section.id || section.className} > ${element.tagName.toLowerCase()} "${element.textContent.trim().slice(0, 30)}"`);
            return;
          }
        }
      });
    });
    return hidden;
  });
}

test('without JavaScript every section is readable', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name === 'phone', 'content visibility does not depend on viewport');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  for (const path of ['./', 'pl/']) {
    await page.goto(path);
    const sections = await page.locator('main section').count();
    expect(sections, path).toBeGreaterThanOrEqual(7);
    expect(await hiddenText(page), path).toEqual([]);
  }
  // The token-build section moved to the design-system case study.
  for (const path of ['work/design-system/', 'pl/work/design-system/']) {
    await page.goto(path);
    await expect(page.locator('main section.build'), path).toHaveCount(1);
    expect(await hiddenText(page), path).toEqual([]);
  }
  await context.close();
});

test('unknown paths get the styled 404 with links home', async ({ page }) => {
  // astro preview serves 404.html for unknown paths under the base; GitHub Pages does the same.
  const response = await page.goto('missing/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('#not-found-title')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"], link[hreflang], meta[property="og:url"]')).toHaveCount(0);
  await expect(page.locator('.lang-switch')).toHaveAttribute('href', '/portfolio-preview/pl/');
  const links = page.locator('.not-found-links a');
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute('href', '/portfolio-preview/');
  await expect(links.nth(1)).toHaveAttribute('href', '/portfolio-preview/pl/');
});
