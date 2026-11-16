import { expect, test, type Page } from '@playwright/test';

/** The section lives on the design-system case study only. */
const CASE = 'work/design-system/';

const steps = (page: Page) => page.locator('.build .steps button');

async function reachBuild(page: Page) {
  await page.goto(CASE);
  await page.waitForTimeout(800);
  await page.locator('.build').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
}

test.describe('token build', () => {
  test('section, heading and five step buttons (Tokens to Pages) are there in both languages', async ({ page }) => {
    await page.goto(CASE);
    await expect(page.getByRole('heading', { level: 2, name: 'From token to page.' })).toBeAttached();
    await expect(steps(page)).toHaveCount(5);
    await expect(steps(page).locator('b')).toHaveText(['Tokens', 'Atoms', 'Molecules', 'Organisms', 'Pages']);
    await expect(page.locator('.build .stage')).toHaveCount(1);
    await expect(page.locator('.build-kicker')).toHaveText("how it's built");
    await page.goto(`pl/${CASE}`);
    await expect(page.getByRole('heading', { level: 2, name: 'Od tokenu do strony.' })).toBeAttached();
    await expect(page.locator('.build-kicker')).toHaveText('jak to jest zbudowane');
    await expect(page.locator('.build .p-accent .label')).toHaveText('Kup teraz');
    await expect(steps(page).locator('b')).toHaveText(['Tokeny', 'Atomy', 'Molekuły', 'Organizmy', 'Strony']);
  });

  test('sits between the case-study hero and the prose, not on the home page or other cases', async ({ page }) => {
    await page.goto(CASE);
    const order = await page.evaluate(() => {
      const build = document.querySelector('.build')!;
      const follows = (selector: string) => Boolean(document.querySelector(selector)!.compareDocumentPosition(build) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { afterHero: follows('.case-hero'), beforeProse: !follows('.case-prose') };
    });
    expect(order).toEqual({ afterHero: true, beforeProse: true });
    for (const path of ['./', 'pl/', 'work/dcc/']) {
      await page.goto(path);
      await expect(page.locator('.build')).toHaveCount(0);
      await expect(page.locator('.pin-spacer')).toHaveCount(0);
    }
  });

  test('clicking 03 jumps to that step', async ({ page }) => {
    await reachBuild(page);
    const third = steps(page).nth(2);
    await third.click();
    await expect(third).toHaveClass(/\bon\b/, { timeout: 1500 });
    await expect(third).toHaveAttribute('aria-current', 'step');
    await page.waitForTimeout(1500);
    await expect(third).toHaveClass(/\bon\b/);
    await expect(steps(page).filter({ has: page.locator('xpath=self::*[contains(concat(" ", @class, " "), " on ")]') })).toHaveCount(1);
    await expect(page.locator('.build')).toBeInViewport();
  });

  test('Enter on focused 05 jumps to the last step', async ({ page }) => {
    await reachBuild(page);
    const fifth = steps(page).nth(4);
    await fifth.focus();
    await page.keyboard.press('Enter');
    await expect(fifth).toHaveClass(/\bon\b/, { timeout: 1500 });
    await page.waitForTimeout(1500);
    await expect(fifth).toHaveClass(/\bon\b/);
    await expect(page.locator('.build .p-page')).toHaveAttribute('style', /(?:^|[;s])left: 2%/);
  });

  test('the active step shows its description, the others stay in the accessibility tree', async ({ page }) => {
    await reachBuild(page);
    const active = page.locator('.build .steps button.on');
    await expect(active).toHaveCount(1);
    await expect(active.locator('small')).toBeVisible();
    const box = (await active.locator('small').boundingBox())!;
    expect(box.height).toBeGreaterThan(12);
    const inactive = page.locator('.build .steps button:not(.on) small');
    await expect(inactive).toHaveCount(4);
    for (const description of await inactive.all()) await expect(description).toHaveCSS('display', 'block');
  });

  test('pieces are visible at rest after entering', async ({ page }) => {
    await reachBuild(page);
    await page.waitForTimeout(1200);
    const scales = await page.locator('.build .piece').evaluateAll((pieces) => pieces.map((piece) => getComputedStyle(piece).transform));
    expect(scales.every((value) => value === 'none' || value === 'matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
  });

  test('reduced motion: not pinned, shows the page, all steps readable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(CASE);
    await page.locator('.build').scrollIntoViewIfNeeded();
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('.build .p-page')).toHaveAttribute('style', /left: 2%; top: 2%; width: 96%; height: 96%/);
    for (let index = 0; index < 5; index++) {
      await expect(steps(page).nth(index)).toBeVisible();
      await expect(steps(page).nth(index).locator('small')).toBeVisible();
    }
    await expect(page.locator('.build .p-accent .label')).toHaveCSS('opacity', '1');
    await steps(page).nth(0).click();
    await expect(page.locator('.build .p-page')).toHaveAttribute('style', /(?:^|[;s])left: 68%/);
    await expect(steps(page).nth(0)).toHaveAttribute('aria-current', 'step');
  });

  for (const width of [360, 390]) {
    test(`phone ${width}px: not pinned, nothing under the header, the build plays while the whole frame is on screen`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'phone', 'phone layout');
      await page.setViewportSize({ width, height: 740 });
      await page.goto(CASE);
      await expect(page.locator('html')).not.toHaveClass(/init-pending/);
      await expect(page.locator('.pin-spacer')).toHaveCount(0);
      // Scrolled to the section the way a hash or focus would: the kicker sits below the header.
      await page.locator('#build').evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'start' }));
      const kicker = await page.locator('.build-kicker').boundingBox();
      const header = await page.locator('header.bar').boundingBox();
      expect(kicker!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
      // Scroll in small steps through the section: whenever the step changes, the whole frame is on screen.
      const seen = new Set<string>();
      const top = await page.locator('#build').evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
      const bottom = await page.locator('#build').evaluate((element) => element.getBoundingClientRect().bottom + window.scrollY);
      for (let y = top - 740; y < bottom; y += 40) {
        await page.evaluate((scroll) => window.scrollTo(0, scroll), y);
        await page.waitForTimeout(60);
        const state = await page.evaluate(() => {
          const stage = document.querySelector('.build .stage')!.getBoundingClientRect();
          const bar = document.querySelector('header.bar')!.getBoundingClientRect();
          return { step: document.querySelector('.build .steps button.on .step-number')?.textContent ?? '', whole: stage.top >= bar.bottom - 1 && stage.bottom <= window.innerHeight + 1 };
        });
        if (!seen.has(state.step) && state.step !== '01') expect(state.whole, `step ${state.step} at ${y}`).toBe(true);
        seen.add(state.step);
      }
      expect([...seen]).toEqual(expect.arrayContaining(['01', '02', '03', '04', '05']));
    });
  }

  test('no horizontal overflow', async ({ page }) => {
    await page.goto(CASE);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('token build atoms', () => {
  test('step 02 shows the atoms with their labels, and every token label is fully visible at step 01', async ({ page }) => {
    await reachBuild(page);
    await steps(page).nth(0).click();
    await expect(steps(page).nth(0)).toHaveClass(/\bon\b/, { timeout: 1500 });
    await expect(page.locator('.build .p-radius .tag')).toHaveCSS('opacity', '1', { timeout: 3000 });
    // The radius.full label is not clipped by its circle: the whole text box sits inside the frame and nothing hides overflow.
    const clipped = await page.locator('.build .piece .tag').evaluateAll((tags) =>
      tags.some((tag) => getComputedStyle(tag.parentElement!).overflow !== 'visible' || tag.scrollWidth > tag.clientWidth + 1));
    expect(clipped).toBe(false);
    await expect(page.locator('.build .p-radius .tag')).toBeInViewport({ ratio: 1 });

    await steps(page).nth(1).click();
    await expect(steps(page).nth(1)).toHaveClass(/\bon\b/, { timeout: 1500 });
    await expect(page.locator('.build .atom-tag')).toHaveText(['atom.check', 'atom.input', 'atom.chip', 'atom.button', 'atom.icon']);
    await expect(page.locator('.build .p-violet .atom-field')).toHaveCSS('opacity', '1', { timeout: 3000 });
    await expect(page.locator('.build .p-accent .label')).toHaveCSS('opacity', '1');
    await expect(page.locator('.build .p-space')).toHaveCSS('opacity', '0');
  });
});
