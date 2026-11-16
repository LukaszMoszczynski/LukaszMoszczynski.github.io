import { expect, test } from '@playwright/test';

/** WCAG relative luminance of an `rgb(r, g, b)` or `#rrggbb` colour. */
function luminance(color: string): number {
  const hex = color.length === 4 ? `#${[...color.slice(1)].map((digit) => digit + digit).join('')}` : color;
  const channels = hex.startsWith('#')
    ? [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))
    : (color.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
  const [red, green, blue] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/** [text token, background token] pairs that carry small text. */
const PAIRS: Array<[string, string]> = [
  ['--ink', '--bg'],
  ['--muted', '--bg'],
  ['--muted', '--surface'],
  ['--accent-ink', '--bg'],
  ['--accent-ink', '--surface'],
  ['--accent-ink', '--card'],
  ['--on-accent', '--accent'],
];

/** `rgb(r g b / a)`, `#rrggbb` or `#rrggbbaa` → [r, g, b, a]. */
function rgba(value: string): number[] {
  if (value.startsWith('#')) {
    const channels = [1, 3, 5, 7].map((index) => parseInt(value.slice(index, index + 2) || 'ff', 16));
    return [channels[0], channels[1], channels[2], channels[3] / 255];
  }
  const numbers = (value.match(/[\d.]+/g) ?? []).map(Number);
  return [numbers[0], numbers[1], numbers[2], numbers[3] ?? 1];
}
const over = (top: number[], alpha: number, bottom: number[]) => top.slice(0, 3).map((channel, index) => channel * alpha + bottom[index] * (1 - alpha));
const hexToRgb = (value: string) => rgba(value).slice(0, 3);
const rgbString = (channels: number[]) => `rgb(${channels.map((channel) => Math.round(channel)).join(', ')})`;

for (const scheme of ['light', 'dark'] as const) {
  test(`text and focus rings keep AA over the cursor glow at its peak in the ${scheme} theme (1.4.3, 1.4.11)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const names = ['--bg', '--muted', '--accent-ink', '--accent-display', '--focus-ring', '--control-line', '--ink', '--glow-a', '--glow-b'];
      return {
        ...Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()])),
        strength: Number(getComputedStyle(document.querySelector('.light-layer')!).opacity),
      };
    }) as Record<string, string> & { strength: number };
    const bg = hexToRgb(tokens['--bg']);
    const glowA = rgba(tokens['--glow-a']);
    const glowB = rgba(tokens['--glow-b']);
    const underA = over(glowA, glowA[3] * tokens.strength, bg);
    const underB = over(glowB, glowB[3] * tokens.strength, bg);
    // The two glows can meet (the second one mirrors the pointer).
    const underBoth = over(glowB, glowB[3] * tokens.strength, underA);
    const backgrounds = [bg, underA, underB, underBoth].map(rgbString);
    const needs: Array<[string, number]> = [['--ink', 4.5], ['--muted', 4.5], ['--accent-ink', 4.5], ['--accent-display', 3], ['--focus-ring', 3], ['--control-line', 3]];
    for (const [token, minimum] of needs) {
      for (const background of backgrounds) {
        expect(contrast(tokens[token], background), `${token} ${tokens[token]} on ${background}`).toBeGreaterThanOrEqual(minimum);
      }
    }
  });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`small-text colour pairs reach AA in the ${scheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    const tokens = await page.evaluate((names) => {
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()]));
    }, [...new Set(PAIRS.flat())]);
    for (const [text, background] of PAIRS) {
      const ratio = contrast(tokens[text], tokens[background]);
      expect(ratio, `${text} (${tokens[text]}) on ${background} (${tokens[background]})`).toBeGreaterThanOrEqual(4.5);
    }
    // Small accent text actually uses the text accent.
    const smallAccent = async (selector: string) => {
      const color = await page.locator(selector).first().evaluate((element) => getComputedStyle(element).color);
      expect(contrast(color, tokens['--bg']), selector).toBeGreaterThanOrEqual(4.5);
    };
    for (const selector of ['.grid-hint', '.career-kicker', '.project-meta']) await smallAccent(selector);
    // The token-build section lives on the design-system case study.
    await page.goto('work/design-system/');
    await smallAccent('.build-kicker');
  });

  test(`outline buttons have a border of at least 3:1 in the ${scheme} theme (1.4.11)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
    const previous = page.locator('#recommendations .prev-quote');
    await previous.scrollIntoViewIfNeeded();
    await expect(previous).toBeVisible();
    for (const selector of ['#recommendations .prev-quote', '#contact .copy-btn']) {
      const border = await page.locator(selector).first().evaluate((element) => getComputedStyle(element).boxShadow);
      const color = border.match(/rgba?\([^)]*\)/)?.[0] ?? '';
      expect(contrast(color, background), `${selector} border ${color} on ${background}`).toBeGreaterThanOrEqual(3);
    }
  });

  test(`hovered pills keep AA text in the ${scheme} theme`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'phone', 'hover needs a fine pointer');
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('./');
    for (const selector of ['#contact .contact-btn:not(.ghost)', '#contact .contact-btn.ghost', '#contact .copy-btn']) {
      const pill = page.locator(selector).first();
      await pill.scrollIntoViewIfNeeded();
      await pill.hover();
      // The wipe and the colour flip take about half a second.
      await expect.poll(() => pill.evaluate((element) => getComputedStyle(element, '::before').clipPath), { timeout: 3000 }).toContain('150%');
      await page.waitForTimeout(500);
      const { text, fill } = await pill.evaluate((element) => ({
        text: getComputedStyle(element).color,
        fill: getComputedStyle(element, '::before').backgroundColor,
      }));
      expect(contrast(text, fill), `${selector} hovered: ${text} on ${fill}`).toBeGreaterThanOrEqual(4.5);
    }
  });
}
