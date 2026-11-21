import { ui, type UiKey } from './ui';

export type Lang = 'en' | 'pl';

function base(): string {
  const value = import.meta.env.BASE_URL || '/';
  return value.endsWith('/') ? value : `${value}/`;
}

/** Path below the site base, always starting with "/" (e.g. "/pl/work/wordpress-shop/"). */
function pathBelowBase(url: URL): string {
  const prefix = base();
  const path = url.pathname;
  const rest = path.startsWith(prefix) ? path.slice(prefix.length) : path.replace(/^\//, '');
  return `/${rest}`;
}

export function getLang(url: URL): Lang {
  const path = pathBelowBase(url);
  return path === '/pl' || path.startsWith('/pl/') ? 'pl' : 'en';
}

export function t(lang: Lang, key: UiKey): string {
  return ui[lang][key];
}

/** `path` is a site path without base and without "/pl", e.g. "/work/wordpress-shop/". */
export function localizePath(path: string, lang: Lang): string {
  const clean = path.replace(/^\/+/, '');
  return `${base()}${lang === 'pl' ? 'pl/' : ''}${clean}`;
}

export function switchLangPath(url: URL, target: Lang): string {
  const path = pathBelowBase(url);
  const withoutLang = path === '/pl' ? '/' : path.replace(/^\/pl\//, '/');
  return localizePath(withoutLang, target);
}
