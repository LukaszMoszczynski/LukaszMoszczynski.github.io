import { readdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/** WCAG 2.2 AA checks axe cannot make on its own (see a11y.spec.ts for the axe audit). */
const slugs = readdirSync('src/content/projects/en').map((file) => file.replace(/\.[^.]+$/, ''));
const pages = [
  './', 'pl/', 'work/', 'pl/work/',
  ...slugs.flatMap((slug) => [`work/${slug}/`, `pl/work/${slug}/`]),
  'missing/',
];

async function ready(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('html')).not.toHaveClass(/init-pending/);
}

test.describe('structure on every page', () => {
  test('landmarks, one h1, no skipped heading levels, named SVGs, lang, link purpose (1.3.1, 1.1.1, 2.4.4, 3.1)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone', 'markup does not depend on the viewport');
    test.setTimeout(120_000);
    for (const path of pages) {
      await ready(page, path);
      const report = await page.evaluate(() => {
        const visible = (element: Element) => {
          for (let node: Element | null = element; node; node = node.parentElement) {
            if (node.getAttribute('aria-hidden') === 'true' || (node as HTMLElement).hidden) return false;
          }
          return true;
        };
        const levels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(visible).map((heading) => Number(heading.tagName[1]));
        const skips: string[] = [];
        levels.forEach((level, index) => {
          if (index > 0 && level > levels[index - 1] + 1) skips.push(`h${levels[index - 1]} → h${level}`);
        });
        const svgs = [...document.querySelectorAll('svg')].filter((svg) => {
          if (!visible(svg)) return false;
          const named = svg.getAttribute('role') === 'img' && (svg.getAttribute('aria-label') || svg.getAttribute('aria-labelledby'));
          return !named;
        }).map((svg) => svg.outerHTML.slice(0, 80));
        const arrowsOnly = [...document.querySelectorAll('a[href]')].filter(visible).filter((link) => {
          const name = (link.getAttribute('aria-label') ?? link.textContent ?? '').replace(/[\s→←↗↳·]/g, '');
          return name.length < 2;
        }).map((link) => link.outerHTML.slice(0, 80));
        return {
          lang: document.documentElement.lang,
          banner: document.querySelectorAll('body > header').length,
          main: document.querySelectorAll('main').length,
          contentinfo: document.querySelectorAll('body > footer').length,
          navs: document.querySelectorAll('nav').length,
          h1: levels.filter((level) => level === 1).length,
          firstLevel: levels[0],
          skips,
          svgs,
          arrowsOnly,
        };
      });
      expect(report.lang, path).toBe(path.startsWith('pl/') ? 'pl' : 'en');
      expect(report.banner, path).toBe(1);
      expect(report.main, path).toBe(1);
      expect(report.contentinfo, path).toBe(1);
      expect(report.navs, path).toBeGreaterThanOrEqual(1);
      expect(report.h1, path).toBe(1);
      expect(report.firstLevel, path).toBe(1);
      expect(report.skips, path).toEqual([]);
      expect(report.svgs, `${path}: SVGs need aria-hidden or role=img with a name`).toEqual([]);
      expect(report.arrowsOnly, `${path}: links named only by an arrow`).toEqual([]);
    }
  });

  test('foreign-language bits carry their own lang (3.1.2)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone', 'markup does not depend on the viewport');
    await ready(page, 'pl/');
    // English originals on the Polish page.
    await expect(page.locator('.quote blockquote').first()).toHaveAttribute('lang', 'en');
    await expect(page.locator('.term-sr')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.bar-tools .lang-seg')).toHaveAttribute('lang', 'en');
    await ready(page, 'missing/');
    await expect(page.locator('#not-found-title [lang="pl"]')).toHaveCount(1);
    await expect(page.locator('.not-found-links a').nth(1)).toHaveAttribute('lang', 'pl');
  });
});

test.describe('keyboard', () => {
  test('the skip link is the first stop, shows, and moves focus to main (2.4.1)', async ({ page }) => {
    await ready(page, './');
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    const box = (await skip.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    await page.keyboard.press('Tab');
    const inMain = await page.evaluate(() => Boolean(document.activeElement?.closest('main')));
    expect(inMain).toBe(true);
  });

  for (const path of ['./', 'work/', 'work/design-system/', 'work/human-in-the-loop/']) {
    test(`every Tab stop on ${path} has a visible ring and is not covered (2.4.7, 2.4.11)`, async ({ page }) => {
      test.setTimeout(120_000);
      await ready(page, path);
      const seen = new Set<string>();
      const problems: string[] = [];
      for (let step = 0; step < 120; step++) {
        await page.keyboard.press('Tab');
        // Let focus-driven scrolling (work-focus.ts) and scrubbed sections follow.
        await page.waitForTimeout(80);
        const state = await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          if (!active || active === document.body) return null;
          const key = active.outerHTML.slice(0, 120);
          const card = active.closest<HTMLElement>('.project-card, .work-index-card');
          const ringed = (element: Element) => {
            const style = getComputedStyle(element);
            return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
          };
          const ring = ringed(active) || Boolean(card && ringed(card));
          const box = active.getBoundingClientRect();
          const header = document.querySelector('header.bar')!.getBoundingClientRect();
          const inHeader = Boolean(active.closest('header.bar, .skip-link'));
          // Points inside the element: the element (or something inside it) must be on top there.
          const points = [[0.5, 0.5], [0.2, 0.5], [0.8, 0.5]].map(([x, y]) => [box.left + box.width * x, box.top + box.height * y]);
          const visiblePoints = points.filter(([x, y]) => {
            const hit = document.elementFromPoint(x, y);
            return Boolean(hit && (active.contains(hit) || hit.contains(active)));
          }).length;
          return {
            key,
            ring,
            inViewport: box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth,
            belowHeader: inHeader || box.top >= header.bottom - 1 || box.bottom <= header.top,
            visiblePoints,
            inFooter: Boolean(active.closest('footer')),
          };
        });
        if (!state) continue;
        if (seen.has(state.key)) {
          if (state.inFooter) break;
          continue;
        }
        seen.add(state.key);
        if (!state.ring) problems.push(`no ring: ${state.key}`);
        if (!state.inViewport) problems.push(`off screen: ${state.key}`);
        else if (!state.belowHeader) problems.push(`under the header: ${state.key}`);
        else if (state.visiblePoints === 0) problems.push(`covered: ${state.key}`);
        if (state.inFooter && step > 5 && state.key.includes('data-motion-toggle')) break;
      }
      expect(seen.size).toBeGreaterThan(5);
      expect(problems).toEqual([]);
    });
  }

  test('menu: focus moves in, stays in, Escape closes and returns focus, page behind is inert (2.1.2)', async ({ page }) => {
    await ready(page, './');
    const toggle = page.locator('.menu-toggle');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#site-menu a').first()).toBeFocused();
    await expect(page.locator('main')).toHaveAttribute('inert', '');
    await expect(page.locator('body > footer')).toHaveAttribute('inert', '');
    for (let step = 0; step < 25; step++) {
      await page.keyboard.press(step % 3 === 2 ? 'Shift+Tab' : 'Tab');
      const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('header.bar')));
      expect(inside, `step ${step}`).toBe(true);
    }
    // The pause switch is in the menu too.
    await expect(page.locator('#site-menu [data-motion-toggle]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  });

  test('token-build steps and the delivery loop work from the keyboard', async ({ page }) => {
    await ready(page, 'work/design-system/');
    const steps = page.locator('.build .steps button');
    expect(await steps.count()).toBeGreaterThanOrEqual(5);
    await steps.nth(2).focus();
    await page.keyboard.press('Enter');
    await expect(steps.nth(2)).toHaveClass(/\bon\b/);
    await ready(page, 'work/human-in-the-loop/');
    const run = page.locator('.factory-loop').getByRole('button', { name: 'Run' });
    await run.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.factory-status')).toHaveText(/./);
    await expect(run).toBeFocused();
  });
});

test.describe('status messages (4.1.3)', () => {
  test('copy and the deck announce through live regions', async ({ page, context }, testInfo) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await ready(page, './');
    const status = page.locator('#contact [role="status"]');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    const copy = page.locator('#contact .copy-btn').first();
    await copy.scrollIntoViewIfNeeded();
    await copy.click();
    await expect(status).not.toBeEmpty();
    const announce = page.locator('.deck-announce');
    await expect(announce).toHaveAttribute('aria-live', 'polite');
    const next = page.locator('.next-quote');
    await next.scrollIntoViewIfNeeded();
    await next.click();
    await expect(announce).toContainText(testInfo.project.name ? '2' : '2');
  });
});

test.describe('pause animations (2.2.2)', () => {
  const ambientTracers = (page: Page) => page.locator('.grid-layer [data-origin="ambient"]').count();

  test('one switch in the footer and the menu stops the tracers and the agent log, and is remembered', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('./');
    const footerToggle = page.locator('footer [data-motion-toggle]');
    await expect(footerToggle).toBeVisible();
    await expect(footerToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(footerToggle).toHaveAccessibleName('Pause animations');
    // Tracers run before.
    await expect.poll(() => ambientTracers(page), { timeout: 8000 }).toBeGreaterThan(0);
    await footerToggle.click();
    await expect(footerToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(/motion-paused/);
    // Running tracers finish at once and none start.
    await expect.poll(() => ambientTracers(page), { timeout: 3000 }).toBe(0);
    await page.waitForTimeout(2500);
    expect(await ambientTracers(page)).toBe(0);
    // The agent log shows the whole run at rest.
    await page.locator('.agent .term').scrollIntoViewIfNeeded();
    const opacities = async () => page.locator('.term-lines:not(.term-sizer) > div').evaluateAll((lines) => lines.map((line) => getComputedStyle(line).opacity));
    await page.waitForTimeout(1200);
    expect(new Set(await opacities())).toEqual(new Set(['1']));
    // The menu copy follows.
    await page.locator('.menu-toggle').click();
    await expect(page.locator('#site-menu [data-motion-toggle]')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    // Remembered across a reload and a client-side navigation.
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/motion-paused/);
    await expect(footerToggle).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(2500);
    expect(await ambientTracers(page)).toBe(0);
    await page.locator('header .logo').click();
    await expect(page.locator('html')).toHaveClass(/motion-paused/);
    // And it can be switched back on.
    await footerToggle.click();
    await expect(footerToggle).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => ambientTracers(page), { timeout: 8000 }).toBeGreaterThan(0);
    expect(await page.evaluate(() => localStorage.getItem('motion-paused'))).toBeNull();
  });

  test('Polish label', async ({ page }) => {
    await page.goto('pl/');
    await expect(page.locator('footer [data-motion-toggle]')).toHaveAccessibleName('Wstrzymaj animacje');
    await expect(page.locator('footer')).toContainText('Zgodna z WCAG 2.2 AA');
  });

  test('not offered with reduced motion: nothing moves on its own there', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page, './');
    await expect(page.locator('footer [data-motion-toggle]')).toBeHidden();
    await page.waitForTimeout(2000);
    expect(await ambientTracers(page)).toBe(0);
  });
});

test.describe('reduced motion (2.3.3)', () => {
  test('nothing pins, scrubs or is split, and the content is complete', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const path of ['./', 'work/design-system/', 'work/human-in-the-loop/']) {
      await ready(page, path);
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }));
      await page.waitForTimeout(300);
      const state = await page.evaluate(() => ({
        pins: document.querySelectorAll('.pin-spacer').length,
        words: document.querySelectorAll('.statement .word').length,
        hidden: [...document.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main p, main li, main blockquote')]
          .filter((element) => !element.closest('[aria-hidden="true"], [hidden], [inert]') && Number(getComputedStyle(element).opacity) < 1)
          .map((element) => element.textContent?.trim().slice(0, 30)),
      }));
      expect(state.pins, path).toBe(0);
      expect(state.words, path).toBe(0);
      expect(state.hidden, path).toEqual([]);
    }
  });
});

test.describe('reflow, zoom and text spacing', () => {
  test('320px wide: no horizontal scroll on any page (1.4.10)', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of pages) {
      await ready(page, path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test('200% zoom of a 1280px window: no horizontal scroll, header leaves room (1.4.4)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone', 'zoom is a desktop check');
    // 200% zoom of 1280×800 lays out like a 640×400 CSS-pixel viewport.
    await page.setViewportSize({ width: 640, height: 400 });
    for (const path of ['./', 'work/', 'work/design-system/']) {
      await ready(page, path);
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        header: document.querySelector('header.bar')!.getBoundingClientRect().height,
      }));
      expect(state.overflow, path).toBeLessThanOrEqual(0);
      expect(state.header, path).toBeLessThan(400 * 0.3);
    }
  });

  test('WCAG text spacing does not clip text or controls (1.4.12)', async ({ page }) => {
    test.setTimeout(90_000);
    for (const path of ['./', 'pl/', 'work/', 'work/human-in-the-loop/', 'work/design-system/']) {
      await ready(page, path);
      await page.addStyleTag({
        content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important } p { margin-bottom: 2em !important }',
      });
      await page.waitForTimeout(200);
      const clipped = await page.evaluate(() => {
        const problems: string[] = [];
        const controls = document.querySelectorAll<HTMLElement>('a, button, .chip, .seg-option, h1, h2, h3, .project-meta, .case-meta, .contact-label');
        controls.forEach((element) => {
          const style = getComputedStyle(element);
          if (style.display === 'none' || element.closest('[aria-hidden="true"], [hidden]')) return;
          const clips = /hidden|clip/.test(style.overflowX + style.overflowY);
          if (clips && (element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2)) {
            problems.push(`${element.tagName.toLowerCase()}.${element.className}: ${element.textContent?.trim().slice(0, 30)}`);
          }
        });
        return {
          problems,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      expect(clipped.problems, path).toEqual([]);
      expect(clipped.overflow, path).toBeLessThanOrEqual(0);
    }
  });
});

test.describe('custom cursor', () => {
  test('hover states do not rely on the custom cursor (it is off with reduced motion and native returns)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone', 'hover needs a fine pointer');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page, './');
    await expect(page.locator('html')).not.toHaveClass(/has-cursor/);
    const link = page.locator('header .logo');
    expect(await link.evaluate((element) => getComputedStyle(element).cursor)).toBe('pointer');
    const before = await link.evaluate((element) => getComputedStyle(element).color);
    await link.hover();
    await expect.poll(() => link.evaluate((element) => getComputedStyle(element).color)).not.toBe(before);
  });
});
