export const THEME_KEY = 'theme';

export type Theme = 'light' | 'dark';

/** The site starts dark, whatever the OS prefers. */
export const DEFAULT_THEME: Theme = 'dark';

/** A valid stored choice wins; anything else (missing, invalid) is the dark default. */
export function resolveTheme(stored: string | null): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return DEFAULT_THEME;
}

export function applyTheme(theme: Theme, target: HTMLElement = document.documentElement): void {
  target.dataset.theme = theme;
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // storage unavailable: the choice lasts for this page only
  }
  return next;
}
