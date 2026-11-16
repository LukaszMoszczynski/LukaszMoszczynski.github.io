import { expect, test, type Locator, type Page } from '@playwright/test';

/** Projects whose visual tells an animated story (all six once every story is in). */
const STORY_SLUGS: string[] = ['qa-agent'];

const settled = (page: Page) => expect(page.locator('html')).not.toHaveAttribute('data-astro-transition', /.*/);

/** Everything a story animates, read from the computed styles of every part of the screen. */
function frame(visual: Locator): Promise<string> {
  return visual.evaluate((root) =>
    [...root.querySelectorAll('.project-screen *')]
      .map((element) => {
        const style = getComputedStyle(element);
        return [style.transform, style.opacity, style.clipPath, style.strokeDashoffset, element.getAttribute('transform') ?? ''].join('|');
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
      await expect(hero).toHaveAttribute('data-visual', slug);
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
        [0, 1, 2, 3, 4, 5].map((position) => position === index && STORY_SLUGS.includes(['qa-agent', 'delivery-loop', 'design-system', 'dcc', 'wp-starter', 'omelanski'][position])),
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
    for (const slug of STORY_SLUGS) {
      await page.goto(`work/${slug}/`);
      const hero = page.locator('.case-hero .project-visual');
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
    for (const slug of STORY_SLUGS) {
      await page.goto(`work/${slug}/`);
      const hero = page.locator('.case-hero .project-visual');
      await expect(hero).toHaveAttribute('data-visual', slug);
      await expect(hero).not.toHaveAttribute('data-visual-state', /.*/);
      await expectStill(hero);
    }
  });
});
