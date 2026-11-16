import { expect, test, type Page } from '@playwright/test';

/** Waits until the ClientRouter has finished its view transition. */
const settled = (page: Page) => expect(page.locator('html')).not.toHaveAttribute('data-astro-transition', /.*/);

const SLUGS = ['dcc', 'design-system', 'qa-agent', 'dark-factory', 'wp-starter', 'omelanski'];
const HOME_PL = ['qa-agent', 'dark-factory'];
const SECTIONS = {
  en: { prefix: '', headings: ['Problem', 'What I built', 'Highlights'], next: 'Next project', note: 'Built at home.pl' },
  pl: { prefix: 'pl/', headings: ['Problem', 'Co zbudowałem', 'Najważniejsze'], next: 'Następny projekt', note: 'Zbudowane w home.pl' },
} as const;

test.describe('case study pages', () => {
  for (const [lang, copy] of Object.entries(SECTIONS)) {
    test(`every project renders its case study (${lang})`, async ({ page }) => {
      for (const [index, slug] of SLUGS.entries()) {
        await page.goto(`${copy.prefix}work/${slug}/`);
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('h1')).not.toBeEmpty();
        await expect(page.locator('.case-summary')).not.toBeEmpty();
        expect(await page.locator('.case-tags li').count()).toBeGreaterThan(0);
        await expect(page.locator('.case-prose h2')).toHaveText([...copy.headings]);
        const next = page.getByRole('navigation', { name: copy.next }).getByRole('link');
        const nextSlug = SLUGS[(index + 1) % SLUGS.length];
        expect(await next.getAttribute('href')).toMatch(new RegExp(`/portfolio-preview/${copy.prefix}work/${nextSlug}/$`));
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      }
    });
  }

  test('language switch keeps the case study', async ({ page }) => {
    await page.goto('work/dcc/');
    await page.getByRole('link', { name: 'Zmień język na polski' }).click();
    await expect(page).toHaveURL(/\/portfolio-preview\/pl\/work\/dcc\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
    await expect(page.locator('.case-prose h2').nth(1)).toHaveText('Co zbudowałem');
  });

  for (const slug of HOME_PL) {
    test(`home.pl project ${slug} shows the note and no images`, async ({ page }) => {
      for (const copy of Object.values(SECTIONS)) {
        await page.goto(`${copy.prefix}work/${slug}/`);
        await expect(page.locator('.case-note')).toContainText(copy.note);
        await expect(page.locator('.case-origin')).toHaveText('home.pl');
        await expect(page.locator('img')).toHaveCount(0);
      }
    });
  }

  test('DCC and Omelański link to their live versions in both languages', async ({ page }) => {
    const expected = [
      { path: 'work/dcc/', name: 'Test version', href: 'http://test.lotusblanc.eu/' },
      { path: 'pl/work/dcc/', name: 'Wersja testowa', href: 'http://test.lotusblanc.eu/' },
      { path: 'work/omelanski/', name: 'GitHub Pages preview', href: 'https://lukaszmoszczynski.github.io/omelanski-site/' },
      { path: 'pl/work/omelanski/', name: 'Podgląd na GitHub Pages', href: 'https://lukaszmoszczynski.github.io/omelanski-site/' },
    ];
    for (const { path, name, href } of expected) {
      await page.goto(path);
      const link = page.locator('.case-links a', { hasText: name });
      await expect(link, path).toHaveAttribute('href', href);
      await expect(link, path).toHaveAttribute('target', '_blank');
    }
  });

  test('other projects carry no home.pl note', async ({ page }) => {
    await page.goto('work/dcc/');
    await expect(page.locator('.case-note')).toHaveCount(0);
  });

  test('a work card opens its case study with the shared visual name', async ({ page }) => {
    await page.goto('./');
    const card = page.locator('#work .project-card').first();
    const name = await card.locator('.project-visual').evaluate((element) => getComputedStyle(element).viewTransitionName);
    expect(name).toBe('visual-dcc');
    await card.locator('a.project-link').click();
    await expect(page).toHaveURL(/\/work\/dcc\/$/);
    const caseName = await page.locator('.case-hero .project-visual').evaluate((element) => getComputedStyle(element).viewTransitionName);
    expect(caseName).toBe('visual-dcc');
  });
});

test.describe('factory loop', () => {
  test('Run walks the ticket round the loop to a clean review', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('work/dark-factory/');
    const factory = page.locator('.factory-loop');
    const run = factory.getByRole('button', { name: 'Run' });
    const status = factory.locator('.factory-status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await run.click();
    await expect(run).toBeDisabled();
    await expect(factory.getByRole('button', { name: 'Jira label' })).toBeDisabled();
    await expect(status).toHaveText(/Factory in local Docker/);
    await expect(status).toHaveText(/Auto-reviewer/, { timeout: 10_000 });
    await expect(status).toHaveText('review clean · ready for a human', { timeout: 25_000 });
    await expect(run).toBeEnabled();
    await expect(factory.locator('.factory-hub-label')).toHaveClass(/is-active/);
  });

  test('Enter on the Jira label starts a run (PL)', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('pl/work/dark-factory/');
    const factory = page.locator('.factory-loop');
    const label = factory.getByRole('button', { name: 'etykieta Jira' });
    const box = (await label.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(40);
    await label.focus();
    await page.keyboard.press('Enter');
    await expect(label).toBeDisabled();
    await expect(label).toBeFocused();
    await expect(factory.locator('.factory-status')).toHaveText('review czyste · gotowe dla człowieka', { timeout: 25_000 });
    await expect(factory.getByRole('button', { name: 'Uruchom' })).toBeEnabled();
  });

  test('leaving mid-run stops cleanly', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('work/dark-factory/');
    await page.locator('.factory-loop').getByRole('button', { name: 'Run' }).click();
    await expect(page.locator('.factory-status')).toHaveText(/Factory in local Docker/);
    await page.getByRole('navigation', { name: 'Next project' }).getByRole('link').click();
    await expect(page).toHaveURL(/\/work\/wp-starter\/$/);
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });
});

test.describe('factory loop, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('is a static labelled diagram listing every stage', async ({ page }) => {
    await page.goto('work/dark-factory/');
    const factory = page.locator('.factory-loop');
    await expect(factory.locator('.factory-stages li')).toHaveText([
      'Jira label · the task goes to the factory',
      'Factory in local Docker · the agent solves the task',
      'Push to GitLab · a merge request opens',
      'Auto-reviewer reads the merge request',
      'Comments · the review asks for changes',
      'Fix · the factory picks up the comments',
      'review clean · ready for a human',
    ]);
    for (const label of ['Jira label', 'factory', 'GitLab push', 'auto-review', 'comments', 'fix', 'human']) {
      await expect(factory.locator('.factory-diagram .factory-label:visible', { hasText: new RegExp(`^${label}$`) })).toBeVisible();
    }
    await expect(factory.getByRole('button')).toHaveCount(0);
    await expect(factory.locator('.factory-arm')).toBeHidden();
  });
});

test('home ↔ case study navigation keeps the token-build pin on the design-system page only, and the tracer limit', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('./');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  for (const slug of ['design-system', 'dcc', 'design-system', 'omelanski', 'design-system']) {
    await page.locator(`#work a.project-link[href$="/work/${slug}/"]`).click();
    await expect(page).toHaveURL(new RegExp(`/work/${slug}/$`));
    await expect(page.locator('h1')).toBeVisible();
    await settled(page);
    await expect(page.locator('.pin-spacer')).toHaveCount(slug === 'design-system' ? 1 : 0);
    if (slug === 'design-system') await expect(page.locator('.build.is-animated')).toHaveCount(1);
    await page.goBack();
    await expect(page.locator('#work')).toHaveCount(1);
    await settled(page);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
  }
  for (let sample = 0; sample < 4; sample++) {
    expect(await page.locator('.grid-layer .tv, .grid-layer .th').count()).toBeLessThanOrEqual(4);
    await page.waitForTimeout(300);
  }
  expect(errors).toEqual([]);
});
