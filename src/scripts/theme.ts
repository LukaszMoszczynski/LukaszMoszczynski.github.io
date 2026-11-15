export const THEME_KEY = 'theme';

export type Theme = 'light' | 'dark';

/** Invalid or missing stored value falls back to the system preference. */
export function resolveTheme(stored: string | null, systemDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return systemDark ? 'dark' : 'light';
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
