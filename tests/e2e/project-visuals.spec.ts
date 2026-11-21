import { expect, test, type Locator, type Page } from '@playwright/test';
import { useTheme } from './helpers';

/** Projects whose visual tells an animated story (all six once every story is in). */
const STORY_SLUGS: string[] = ['qa-agent', 'human-in-the-loop', 'design-system', 'multi-brand-sites', 'wordpress-shop', 'figma-to-wordpress', 'company-website'];

/** The delivery loop case page has no hero visual: its interactive board takes the place (and the transition name). */
const CASE_SLUGS = STORY_SLUGS.filter((slug) => slug !== 'human-in-the-loop');

const settled = (page: Page) => expect(page.locator('html')).not.toHaveAttribute('data-astro-transition', /.*/);

/** Everything a story animates, read from the computed styles of every part of the screen. */
function frame(visual: Locator): Promise<string> {
  return visual.evaluate((root) =>
    [...root.querySelectorAll('.project-screen *')]
      .map((element) => {
        const style = getComputedStyle(element);
        // GSAP leaves an identity matrix on SVG parts it reverts: the same picture as no transform.
        const identity = (value: string) => (/^matrix\(1, ?0, ?0, ?1, ?0, ?0\)$/.test(value) ? 'none' : value);
        return [identity(style.transform), style.opacity, style.clipPath, style.strokeDashoffset, identity(element.getAttribute('transform') ?? 'none')].join('|');
      })
      .join(';'),
  );
}

/** The frame changes within a few seconds: the story's timeline runs. */
async function expectMoving(visual: Locator): Promise<void> {
  const first = await frame(visual);
  await expect.poll(() => frame(visual), { timeout: 5_000, intervals: [250] }).not.toBe(first);
}

/** The frame stays the same for 1.5 s. */
async function expectStill(visual: Locator): Promise<void> {
  const first = await frame(visual);
  await visual.page().waitForTimeout(1_500);
  expect(await frame(visual)).toBe(first);
}

/** Scrolls the home card to its resting place: in the sticky stack that makes it the front card. */
async function showHomeCard(page: Page, index: number): Promise<void> {
  await page.evaluate((cardIndex) => {
    const stack = document.querySelector<HTMLElement>('.work-stack')!;
    const cards = [...stack.querySelectorAll<HTMLElement>('.project-card')];
    const gap = parseFloat(getComputedStyle(stack).rowGap) || 0;
    let top = stack.getBoundingClientRect().top + window.scrollY;
    for (const card of cards.slice(0, cardIndex)) top += card.offsetHeight + gap;
    window.scrollTo({ top: top - (88 + cardIndex * 16), behavior: 'instant' });
  }, index);
}

const homeVisual = (page: Page, slug: string) =>
  page.locator('#work .project-card', { has: page.locator(`a.project-link[href$="/work/${slug}/"]`) }).locator('.project-visual');
const indexVisual = (page: Page, slug: string) =>
  page.locator('.work-index-card', { has: page.locator(`h2 a[href$="/work/${slug}/"]`) }).locator('.project-visual');

test.describe('project visuals', () => {
  for (const slug of STORY_SLUGS) {
    test(`${slug}: the same story plays on the home card, the /work/ card and the case hero`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto('./');
      const cards = page.locator('#work .project-card');
      const index = await cards.evaluateAll((elements, wanted) => elements.findIndex((card) => card.querySelector(`a.project-link[href$="/work/${wanted}/"]`)), slug);
      await showHomeCard(page, index);
      const home = homeVisual(page, slug);
      await expect(home).toHaveAttribute('data-visual', slug);
      await expect(home).toHaveAttribute('data-visual-state', 'playing');
      await expectMoving(home);

      await page.goto('work/');
      const listed = indexVisual(page, slug);
      await listed.scrollIntoViewIfNeeded();
      await expect(listed).toHaveAttribute('data-visual', slug);
      await expect(listed).toHaveAttribute('data-visual-state', 'playing');
      await expectMoving(listed);

      await page.goto(`work/${slug}/`);
      const hero = page.locator('.case-hero .project-visual');
      if (!CASE_SLUGS.includes(slug)) {
        await expect(hero).toHaveCount(0);
        return;
      }
      await expect(hero).toHaveAttribute('data-visual', slug);
      await hero.scrollIntoViewIfNeeded();
      await expect(hero).toHaveAttribute('data-visual-state', 'playing');
      await expectMoving(hero);
    });
  }

  test('only the front card of the home stack plays', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop' || STORY_SLUGS.length < 2, 'the stack is sticky on wide screens only');
    await page.goto('./');
    const visuals = page.locator('#work .project-visual');
    for (const index of [0, 2, 4]) {
      await showHomeCard(page, index);
      await expect.poll(() => visuals.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-visual-state') === 'playing'))).toEqual(
        [0, 1, 2, 3, 4, 5, 6].map((position) => position === index && STORY_SLUGS.includes(['qa-agent', 'human-in-the-loop', 'design-system', 'multi-brand-sites', 'wordpress-shop', 'figma-to-wordpress', 'company-website'][position])),
      );
    }
  });

  test('a visual scrolled out of view holds still', async ({ page }) => {
    test.skip(!STORY_SLUGS.length, 'no story yet');
    await page.goto(`work/${STORY_SLUGS[0]}/`);
    const hero = page.locator('.case-hero .project-visual');
    await expect(hero).toHaveAttribute('data-visual-state', 'playing');
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(hero).toHaveAttribute('data-visual-state', 'held');
    await expectStill(hero);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(hero).toHaveAttribute('data-visual-state', 'playing');
  });

  test('Pause animations puts every visual on its finished frame, the one the server renders', async ({ page }) => {
    test.skip(!STORY_SLUGS.length, 'no story yet');
    for (const slug of CASE_SLUGS) {
      await page.goto(`work/${slug}/`);
      const hero = page.locator('.case-hero .project-visual');
      await hero.scrollIntoViewIfNeeded();
      await expect(hero).toHaveAttribute('data-visual-state', 'playing');
      await page.evaluate(() => document.querySelector<HTMLButtonElement>('footer [data-motion-toggle]')!.click());
      await expect(hero).toHaveAttribute('data-visual-state', 'at-rest');
      await expectStill(hero);
      const paused = await frame(hero);
      await page.evaluate(() => document.querySelector<HTMLButtonElement>('footer [data-motion-toggle]')!.click());
      await expect(hero).toHaveAttribute('data-visual-state', 'playing');
      await expectMoving(hero);
      // The finished frame equals the drawing without any script.
      const server = await page.context().newPage();
      await server.route('**/*.js', (route) => route.abort());
      await server.goto(page.url());
      expect(await frame(server.locator('.case-hero .project-visual')), slug).toBe(paused);
      await server.close();
      await page.evaluate(() => localStorage.removeItem('motion-paused'));
    }
  });

  test('a stored Pause animations choice keeps every visual still', async ({ page }) => {
    test.skip(!STORY_SLUGS.length, 'no story yet');
    await page.addInitScript(() => localStorage.setItem('motion-paused', '1'));
    await page.goto('work/');
    for (const slug of STORY_SLUGS) {
      const visual = indexVisual(page, slug);
      await visual.scrollIntoViewIfNeeded();
      await expect(visual).toHaveAttribute('data-visual-state', 'at-rest');
      await expectStill(visual);
    }
  });

  test('client-side navigations leave no story timeline behind', async ({ page }) => {
    test.skip(!STORY_SLUGS.length, 'no story yet');
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
    });
    const slug = STORY_SLUGS[0];
    await page.goto('work/');
    await indexVisual(page, slug).locator('xpath=..').locator('h2 a').click();
    await expect(page).toHaveURL(new RegExp(`/work/${slug}/$`));
    await settled(page);
    await expect(page.locator('.case-hero .project-visual')).toHaveAttribute('data-visual-state', 'playing');
    await page.locator('.case-back').click();
    await expect(page).toHaveURL(/\/work\/$/);
    await settled(page);
    const last = STORY_SLUGS.at(-1)!;
    await indexVisual(page, last).locator('xpath=..').locator('h2 a').click();
    await expect(page).toHaveURL(new RegExp(`/work/${last}/$`));
    await settled(page);
    await page.waitForTimeout(1_000);

    const leftovers = await page.evaluate(() => {
      const count = (window as unknown as { projectVisualTimelines: () => { live: number; detached: number } }).projectVisualTimelines();
      return { ...count, visuals: document.querySelectorAll('.project-visual').length };
    });
    expect(leftovers.detached).toBe(0);
    expect(leftovers.live).toBeLessThanOrEqual(leftovers.visuals);
    expect(leftovers.live).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});

test.describe('project visuals, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('every visual stays on its finished frame', async ({ page }) => {
    test.skip(!STORY_SLUGS.length, 'no story yet');
    for (const slug of CASE_SLUGS) {
      await page.goto(`work/${slug}/`);
      const hero = page.locator('.case-hero .project-visual');
      await expect(hero).toHaveAttribute('data-visual', slug);
      await expect(hero).not.toHaveAttribute('data-visual-state', /.*/);
      await expectStill(hero);
    }
  });
});

test.describe('delivery loop: the card is a compact copy of the case board', () => {
  /** The look of the drawing: computed paint of each kind of part, and how many there are. */
  const look = (scope: Locator) =>
    scope.evaluate((root) => {
      const paint = (selector: string) => {
        const element = root.querySelector(selector)!;
        const style = getComputedStyle(element);
        return [style.fill, style.stroke, style.strokeWidth, style.strokeDasharray].join(' ');
      };
      const count = (selector: string) => root.querySelectorAll(selector).length;
      return {
        nodes: count('.factory-node'), hubs: count('.factory-hub'), rings: count('.factory-ring'), tickets: count('.factory-ticket'),
        node: paint('.factory-node:not(.is-factory)'), factory: paint('.factory-node.is-factory'),
        ring: paint('.factory-ring'), hub: paint('.factory-hub'), ticket: paint('.factory-ticket'),
        radii: [...root.querySelectorAll('.factory-node')].map((node) => node.getAttribute('r')).join(','),
      };
    });

  for (const scheme of ['light', 'dark'] as const) {
    test(`same stations, track, hub, ticket and colours as the board (${scheme})`, async ({ page }) => {
      await useTheme(page, scheme);
      await page.goto('work/');
      const card = indexVisual(page, 'human-in-the-loop');
      const cardLook = await look(card);
      await page.goto('work/human-in-the-loop/');
      const boardLook = await look(page.locator('.factory-board'));
      expect(cardLook).toEqual(boardLook);
      expect(cardLook.nodes).toBe(6);
    });
  }

  test('at rest only the hub is lit, the ticket sits in its middle, and every light sits exactly on its station', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('work/');
    const card = indexVisual(page, 'human-in-the-loop');
    await card.scrollIntoViewIfNeeded();
    const rest = await card.evaluate((root) => {
      const centre = (element: Element) => {
        const box = element.getBoundingClientRect();
        return { x: box.left + box.width / 2, y: box.top + box.height / 2, width: box.width };
      };
      const lights = [...root.querySelectorAll<SVGElement>('.loop-lit')];
      return {
        lit: lights.filter((light) => Number(getComputedStyle(light).opacity) > 0).map((light) => light.dataset.lit),
        hub: centre(root.querySelector('.factory-hub')!),
        ticket: centre(root.querySelector('.factory-ticket')!),
        offsets: lights.map((light) => {
          const target = light.dataset.lit === 'clean' ? root.querySelector('.factory-hub')! : root.querySelector(`.factory-node[data-stage="${light.dataset.lit}"]`)!;
          const [a, b] = [centre(light), centre(target)];
          return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.width - b.width));
        }),
      };
    });
    expect(rest.lit).toEqual(['clean']);
    expect(Math.abs(rest.ticket.x - rest.hub.x)).toBeLessThan(1);
    expect(Math.abs(rest.ticket.y - rest.hub.y)).toBeLessThan(1);
    expect(Math.max(...rest.offsets)).toBeLessThan(0.5);
  });

  test('while it plays, one station at a time lights up, exactly over the station (no stray rings), as on the board', async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto('work/');
    const card = indexVisual(page, 'human-in-the-loop');
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute('data-visual-state', 'playing');
    const seen = new Set<string>();
    for (let sample = 0; sample < 40; sample++) {
      const state = await card.evaluate((root) => {
        const centre = (element: Element) => {
          const box = element.getBoundingClientRect();
          return { x: box.left + box.width / 2, y: box.top + box.height / 2, width: box.width };
        };
        return [...root.querySelectorAll<SVGElement>('.loop-lit')]
          .filter((light) => Number(getComputedStyle(light).opacity) > 0.95 && light.dataset.lit !== 'clean')
          .map((light) => {
            const own = centre(light);
            const station = centre(root.querySelector(`.factory-node[data-stage="${light.dataset.lit}"]`)!);
            return { stage: light.dataset.lit!, size: Math.abs(own.width - station.width) + Math.hypot(own.x - station.x, own.y - station.y) };
          });
      });
      expect(state.length).toBeLessThanOrEqual(1);
      for (const light of state) {
        seen.add(light.stage);
        expect(light.size).toBeLessThan(0.5);
      }
      await page.waitForTimeout(250);
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});

test.describe('home.pl platform: sections build a page that re-skins per brand', () => {
  test('the slots come from the CMS column, every brand accent takes its turn, and basket and configurator fan out', async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto('work/multi-brand-sites/');
    const hero = page.locator('.case-hero .project-visual');
    await hero.scrollIntoViewIfNeeded();
    await expect(hero).toHaveAttribute('data-visual-state', 'playing');
    const brands = new Set<string>();
    let slotsAway = false;
    let minisHidden = false;
    for (let sample = 0; sample < 50; sample++) {
      const state = await hero.evaluate((root) => {
        const tints = [...root.querySelectorAll<HTMLElement>('.hp-bar .hp-tint')];
        const shown = tints.filter((tint) => Number(getComputedStyle(tint).opacity) > 0.95).map((tint) => tint.dataset.brand!);
        const firstSlot = root.querySelector('.hp-slot')!.getBoundingClientRect();
        const firstSection = root.querySelector('.hp-section')!.getBoundingClientRect();
        const minis = [...root.querySelectorAll('.hp-mini')].map((mini) => Number(getComputedStyle(mini).opacity));
        return { top: shown.at(-1) ?? '0', slotOnSection: Math.abs(firstSlot.left - firstSection.left) < 2, minisHidden: minis.every((opacity) => opacity < 0.05) };
      });
      brands.add(state.top);
      slotsAway ||= state.slotOnSection;
      minisHidden ||= state.minisHidden;
      await page.waitForTimeout(150);
    }
    expect([...brands].sort()).toEqual(['0', '1', '2', '3']);
    expect(slotsAway).toBe(true);
    expect(minisHidden).toBe(true);
  });
});
