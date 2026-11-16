import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, resolveTheme, THEME_KEY } from '../../src/scripts/theme';

describe('resolveTheme', () => {
  it('uses a valid stored value', () => {
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('light')).toBe('light');
  });
  it('starts dark without a valid stored choice', () => {
    expect(resolveTheme(null)).toBe('dark');
    expect(resolveTheme('blue')).toBe('dark');
    expect(DEFAULT_THEME).toBe('dark');
  });
  it('stores under the theme key', () => {
    expect(THEME_KEY).toBe('theme');
  });
});
