import { expect, test } from '@playwright/test';

/** Case studies renamed on 2026-11-21: old addresses (old CVs, shared links) must land on the new page. */
const RENAMED: Record<string, string> = {
  dcc: 'wordpress-shop',
  omelanski: 'company-website',
  'wp-starter': 'figma-to-wordpress',
  'home-platform': 'multi-brand-sites',
  'delivery-loop': 'human-in-the-loop',
};

for (const [from, to] of Object.entries(RENAMED)) {
  for (const prefix of ['', 'pl/']) {
    test(`/${prefix}work/${from}/ redirects to /${prefix}work/${to}/`, async ({ page }) => {
      await page.goto(`${prefix}work/${from}/`);
      await expect(page).toHaveURL(new RegExp(`/portfolio-preview/${prefix}work/${to}/$`));
      await expect(page.locator('h1')).toBeVisible();
    });
  }
}
