import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLang, localizePath, switchLangPath } from '../../src/i18n/utils';
import { ui } from '../../src/i18n/ui';

describe('i18n utils', () => {
  beforeEach(() => {
    vi.stubEnv('BASE_URL', '/portfolio-preview/');
  });

  it('detects language from the URL', () => {
    expect(getLang(new URL('https://x.dev/portfolio-preview/pl/work/dcc/'))).toBe('pl');
    expect(getLang(new URL('https://x.dev/portfolio-preview/work/dcc/'))).toBe('en');
  });

  it('localizes paths with base and language prefix', () => {
    expect(localizePath('/', 'en')).toBe('/portfolio-preview/');
    expect(localizePath('/work/dcc/', 'pl')).toBe('/portfolio-preview/pl/work/dcc/');
  });

  it('switches language keeping the page', () => {
    expect(switchLangPath(new URL('https://x.dev/portfolio-preview/work/dcc/'), 'pl')).toBe('/portfolio-preview/pl/work/dcc/');
    expect(switchLangPath(new URL('https://x.dev/portfolio-preview/pl/'), 'en')).toBe('/portfolio-preview/');
  });

  it('has no missing translations', () => {
    expect(Object.keys(ui.pl).sort()).toEqual(Object.keys(ui.en).sort());
  });
});
