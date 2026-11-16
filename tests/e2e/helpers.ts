import { expect, type Page } from '@playwright/test';

/**
 * The language and theme switches sit in the header on wider screens; on phones (and while the
 * menu is open) only their copies in the menu are shown. This opens the menu when the header
 * copies are hidden, so the visible switches can be used on every viewport.
 */
export async function showSwitches(page: Page): Promise<void> {
  if (await page.locator('.bar-tools [data-lang-switch]').isVisible()) return;
  const button = page.locator('header .menu-toggle');
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
  await expect(page.locator('#site-menu [data-lang-switch]')).toBeVisible();
}

/** The language pill the reader can see right now (opens the menu on phones). */
export async function langSwitch(page: Page) {
  await showSwitches(page);
  return page.locator('header [data-lang-switch]:visible');
}

/** The theme switch the reader can see right now (opens the menu on phones). */
export async function themeSwitch(page: Page) {
  await showSwitches(page);
  return page.locator('header [data-theme-toggle]:visible');
}

/**
 * Starts the page in a theme the way a returning reader would have it: a stored choice.
 * Seeded once per tab, so a later switch and reload keep the reader's new choice.
 */
export async function useTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.addInitScript((value) => {
    try {
      if (sessionStorage.getItem('theme-seeded')) return;
      sessionStorage.setItem('theme-seeded', '1');
      localStorage.setItem('theme', value);
    } catch {
      // storage blocked: the test will see the default theme
    }
  }, theme);
}
