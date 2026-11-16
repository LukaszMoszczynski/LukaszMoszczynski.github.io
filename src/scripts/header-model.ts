/** Gsap- and router-free helpers for the header menu, safe to unit-test. */

/** Same page, different (or the same) #hash: the menu scrolls there itself instead of navigating. */
export function samePageHash(href: string, current: Location | URL): string | null {
  const url = new URL(href, current.href);
  if (!url.hash || url.origin !== current.origin || url.pathname !== current.pathname || url.search !== current.search) return null;
  return url.hash;
}

/** Index of the element focus moves to on Tab (or Shift+Tab) inside a trap of `count` elements. */
export function trapIndex(current: number, count: number, backwards: boolean): number {
  if (count <= 0) return -1;
  if (current < 0) return backwards ? count - 1 : 0;
  return (current + (backwards ? -1 : 1) + count) % count;
}
