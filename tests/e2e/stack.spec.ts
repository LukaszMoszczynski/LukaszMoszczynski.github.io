import { expect, test } from '@playwright/test';
import { ui } from '../../src/i18n/ui';

test.describe('stack and agent log', () => {
  test('default chip is QA agent and the terminal shows its comment line', async ({ page }) => {
    await page.goto('./');
    const chip = page.locator('#stack .chip', { hasText: ui.en['stack.ai.chip.qa'] });
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#stack .term-lines:not(.term-sizer)')).toContainText('new feature');
  });

  test('clicking the factory chip switches lines and pressed state', async ({ page }) => {
    await page.goto('./');
    const factory = page.locator('#stack .chip', { hasText: ui.en['stack.ai.chip.factory'] });
    await factory.click();
    await expect(factory).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#stack .chip[data-run="qa"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#stack .term-lines:not(.term-sizer)')).toContainText('Jira label');
  });

  test('terminal is a polite live region with an example-run caption', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#stack .term')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#stack .agent-caption')).toContainText(/example run/i);
  });

  test('AI card links to both case studies; Polish chip uses the case-study name', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#stack .skill.ai a[href$="work/qa-agent/"]')).toHaveCount(1);
    await expect(page.locator('#stack .skill.ai a[href$="work/delivery-loop/"]')).toHaveCount(1);
    await expect(page.locator('#stack .skill')).toHaveCount(4);
    await page.goto('pl/');
    await expect(page.locator('#stack .chip[data-run="factory"]')).toHaveText('Człowiek w pętli');
    await expect(page.locator('#stack .skill.ai a[href$="pl/work/delivery-loop/"]')).toHaveCount(1);
  });

  test('reduced motion shows every line without replay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    const lines = page.locator('#stack .term-lines:not(.term-sizer) > div');
    await expect(lines).toHaveCount(8);
    const opacities = await lines.evaluateAll((nodes) => nodes.map((node) => Number(getComputedStyle(node).opacity)));
    expect(opacities.every((value) => value === 1)).toBe(true);
    await page.locator('#stack .chip[data-run="figma"]').click();
    await expect(lines).toHaveCount(6);
  });

  test('the log shows text within 500 ms of coming into view and of a tab switch, and is never empty between runs', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('./');
    await expect(page.locator('html')).not.toHaveClass(/init-pending/);
    const visibleText = () => page.locator('#stack .term-lines:not(.term-sizer)').evaluate((element) =>
      [...element.children].filter((line) => Number(getComputedStyle(line).opacity) > 0.5 && (line.textContent ?? '').trim()).length);
    await page.locator('#stack .term').evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.waitForTimeout(500);
    expect(await visibleText()).toBeGreaterThan(0);
    // The box is as tall as the tallest run from the start: switching tabs never moves the page.
    const height = () => page.locator('#stack .term').evaluate((element) => element.getBoundingClientRect().height);
    const startHeight = await height();
    for (const run of ['factory', 'figma', 'qa']) {
      await page.locator(`#stack .chip[data-run="${run}"]`).click();
      await page.waitForTimeout(500);
      expect(await visibleText(), run).toBeGreaterThan(0);
      expect(await height(), run).toBe(startHeight);
    }
    // A whole loop (8 lines × 0.45 s + 2.5 s hold + fade) and into the next one: never an empty box.
    for (let sample = 0; sample < 40; sample++) {
      expect(await visibleText(), `sample ${sample}`).toBeGreaterThan(0);
      await page.waitForTimeout(200);
    }
  });

  test('"Pause animations" shows the complete run at rest', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('motion-paused', '1'));
    await page.goto('./');
    await page.locator('#stack .term').scrollIntoViewIfNeeded();
    const lines = page.locator('#stack .term-lines:not(.term-sizer) > div');
    await expect(lines).toHaveCount(8);
    const opacities = await lines.evaluateAll((nodes) => nodes.map((node) => Number(getComputedStyle(node).opacity)));
    expect(opacities.every((value) => value === 1)).toBe(true);
  });

  test('no horizontal page scroll', async ({ page }) => {
    await page.goto('./');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
