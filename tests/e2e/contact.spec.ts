import { expect, test } from '@playwright/test';

const email = 'moszczynski.luk@gmail.com';
const phone = '+48 880 944 496';

test.describe('contact', () => {
  test('shows email and phone as text with mailto/tel links', async ({ page }) => {
    await page.goto('./');
    const contact = page.locator('#contact');
    await expect(contact.getByText(email, { exact: true })).toBeAttached();
    await expect(contact.getByText(phone, { exact: true })).toBeAttached();
    await expect(contact.locator(`a[href="mailto:${email}"]`)).toBeAttached();
    await expect(contact.locator('a[href="tel:+48880944496"]')).toBeAttached();
  });

  test('copy button puts the email on the clipboard and reads Copied for a while', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are chromium-only');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('./');
    const button = page.locator('#contact').getByRole('button', { name: 'Copy email address' });
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect(button).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(email);
    await expect(button).toHaveText('Copy', { timeout: 5000 });
  });

  test('Polish labels', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are chromium-only');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('pl/');
    const button = page.locator('#contact').getByRole('button', { name: 'Skopiuj numer telefonu' });
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await expect(button).toHaveText('Skopiowano');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(phone);
  });

  test('copy buttons are at least 40px tall', async ({ page }) => {
    await page.goto('./');
    for (const button of await page.locator('#contact button').all()) {
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('LinkedIn and GitHub open in a new tab', async ({ page }) => {
    await page.goto('./');
    const linkedin = page.locator('#contact a[href="https://www.linkedin.com/in/%C5%82ukasz-moszczy%C5%84ski-764110161/"]');
    const github = page.locator('#contact a[href="https://github.com/LukaszMoszczynski"]');
    for (const link of [linkedin, github]) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('the fill line ends at --p: 100% after scrolling to the bottom', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(() => page.locator('#contact .fill').evaluate((element) => (element as HTMLElement).style.getPropertyValue('--p').trim()))
      .toBe('100%');
  });

  test('without motion the line is fully orange at rest', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    const value = await page.locator('#contact .fill').evaluate((element) => getComputedStyle(element).getPropertyValue('--p').trim());
    expect(value).toBe('100%');
  });

  test('no horizontal scroll at the bottom', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
