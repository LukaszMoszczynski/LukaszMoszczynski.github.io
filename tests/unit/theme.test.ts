import { describe, expect, it } from 'vitest';
import { resolveTheme, THEME_KEY } from '../../src/scripts/theme';

describe('resolveTheme', () => {
  it('uses a valid stored value', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });
  it('falls back to the system preference', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme('blue', false)).toBe('light');
    expect(resolveTheme('blue', true)).toBe('dark');
  });
  it('stores under the theme key', () => {
    expect(THEME_KEY).toBe('theme');
  });
});
