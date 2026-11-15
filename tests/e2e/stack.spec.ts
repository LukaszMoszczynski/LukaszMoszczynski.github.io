import { expect, test } from '@playwright/test';
import { ui } from '../../src/i18n/ui';

test.describe('stack and agent log', () => {
  test('default chip is QA agent and the terminal shows its comment line', async ({ page }) => {
    await page.goto('./');
    const chip = page.locator('#stack .chip', { hasText: ui.en['stack.ai.chip.qa'] });
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#stack .term-lines')).toContainText('new feature');
  });

  test('clicking the factory chip switches lines and pressed state', async ({ page }) => {
    await page.goto('./');
    const factory = page.locator('#stack .chip', { hasText: ui.en['stack.ai.chip.factory'] });
    await factory.click();
    await expect(factory).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#stack .chip[data-run="qa"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#stack .term-lines')).toContainText('Jira label');
  });

  test('terminal is a polite live region with an example-run caption', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#stack .term')).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('#stack .agent-caption')).toContainText(/example run/i);
  });

  test('AI card links to both case studies; Polish chip uses the case-study name', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#stack .skill.ai a[href$="work/qa-agent/"]')).toHaveCount(1);
    await expect(page.locator('#stack .skill.ai a[href$="work/dark-factory/"]')).toHaveCount(1);
    await expect(page.locator('#stack .skill')).toHaveCount(4);
    await page.goto('pl/');
    await expect(page.locator('#stack .chip[data-run="factory"]')).toHaveText('Półciemna fabryka');
    await expect(page.locator('#stack .skill.ai a[href$="pl/work/dark-factory/"]')).toHaveCount(1);
  });

  test('reduced motion shows every line without replay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    const lines = page.locator('#stack .term-lines > div');
    await expect(lines).toHaveCount(8);
    const opacities = await lines.evaluateAll((nodes) => nodes.map((node) => Number(getComputedStyle(node).opacity)));
    expect(opacities.every((value) => value === 1)).toBe(true);
    await page.locator('#stack .chip[data-run="figma"]').click();
    await expect(lines).toHaveCount(6);
  });

  test('no horizontal page scroll', async ({ page }) => {
    await page.goto('./');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
