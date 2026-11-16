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
    for (const selector of ['.build-kicker', '.grid-hint', '.career-kicker', '.project-meta']) {
      const color = await page.locator(selector).first().evaluate((element) => getComputedStyle(element).color);
      expect(contrast(color, tokens['--bg']), selector).toBeGreaterThanOrEqual(4.5);
    }
  });
}
