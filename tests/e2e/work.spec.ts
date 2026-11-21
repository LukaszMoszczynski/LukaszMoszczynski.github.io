import { expect, test } from '@playwright/test';

const SLUGS = ['qa-agent', 'human-in-the-loop', 'design-system', 'multi-brand-sites', 'wordpress-shop', 'figma-to-wordpress', 'company-website'];

test.describe('selected work', () => {
  for (const [path, prefix] of [['./', 'work/'], ['pl/', 'pl/work/']]) {
    test(`7 project cards link to their case studies (${path})`, async ({ page }) => {
      await page.goto(path);
      const cards = page.locator('#work article.project-card');
      await expect(cards).toHaveCount(7);
      for (const [index, slug] of SLUGS.entries()) {
        const href = await cards.nth(index).locator('a').first().getAttribute('href');
        expect(href).toMatch(new RegExp(`/portfolio-preview/${prefix}${slug}/$`));
      }
    });
  }

  for (const [path, titles] of [
    ['./', ['AI QA agent for merge requests', 'Human-in-the-loop delivery', 'Multi-brand design system synced with Figma', 'Multi-brand sales sites built from one page creator', 'WordPress shop with online payments', 'Figma to WordPress starter', 'Fast static company website']],
    ['pl/', ['Agent AI do testów merge requestów', 'Automatyczny proces z człowiekiem w pętli', 'Wielomarkowy design system zsynchronizowany z Figmą', 'Wielomarkowe strony sprzedażowe z jednego kreatora stron', 'Sklep WordPress z płatnościami online', 'Starter Figma → WordPress', 'Szybka statyczna strona firmowa']],
  ] as const) {
    test(`cards are titled by what was delivered, the client is a small chip (${path})`, async ({ page }) => {
      await page.goto(path);
      const cards = page.locator('#work article.project-card');
      await expect(cards.locator('h3')).toHaveText([...titles]);
      const clients = ['home.pl', 'home.pl', null, 'home.pl', null, null, null];
      for (const [index, client] of clients.entries()) {
        const chip = cards.nth(index).locator('.project-client');
        if (client) await expect(chip).toHaveText(client);
        else await expect(chip).toHaveCount(0);
      }
      // The /work/ list uses the same titles and chips.
      await page.goto(`${path}work/`);
      await expect(page.locator('.work-index-card h2')).toHaveText([...titles]);
      await expect(page.locator('.work-index-client')).toHaveText(['home.pl', 'home.pl', 'home.pl']);
    });
  }

  test('case pages, their titles and next links name the delivery; the menu keeps short names', async ({ page }) => {
    await page.goto('work/company-website/');
    await expect(page.locator('h1')).toHaveText('Fast static company website');
    await expect(page).toHaveTitle(/^Fast static company website · /);
    await expect(page.locator('.case-client')).toHaveCount(0);
    await page.goto('pl/work/figma-to-wordpress/');
    await expect(page.locator('.case-next-name')).toHaveText('Szybka statyczna strona firmowa');
    await expect(page.locator('.case-client')).toHaveCount(0);
    await expect(page.locator('.menu-projects a')).toHaveText(['Agent QA', 'Człowiek w pętli', 'Design system', 'Strony wielu marek', 'Sklep WordPress', 'Figma → WordPress', 'Strona firmowa']);
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
    expect(await copyOpacity(6)).toBe(1);
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
    await expect(cards).toHaveCount(7);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    for (const card of await cards.all()) {
      expect(await card.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
      expect(await card.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
    }
  });
});

test.describe('work index page', () => {
  for (const [path, heading] of [['work/', 'Work'], ['pl/work/', 'Projekty']] as const) {
    test(`${path} lists all seven projects with links, summaries and tags`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      const cards = page.locator('.work-index-card');
      await expect(cards).toHaveCount(7);
      for (const [index, slug] of SLUGS.entries()) {
        const card = cards.nth(index);
        await expect(card.locator('h2 a')).toHaveAttribute('href', new RegExp(`/portfolio-preview/${path}${slug}/$`));
        await expect(card.locator('.work-index-summary')).not.toBeEmpty();
        expect(await card.locator('.work-index-tags li').count()).toBeGreaterThan(0);
        await expect(card.locator('.project-visual')).toHaveCount(1);
      }
    });
  }

  test('the menu Work link still goes to the home section', async ({ page }) => {
    await page.goto('work/');
    await expect(page.locator('#site-menu .menu-link').first()).toHaveAttribute('href', /\/portfolio-preview\/#work$/);
  });
});
