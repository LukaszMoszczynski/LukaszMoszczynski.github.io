/**
 * Keeps the reader's place across a language switch. GSAP-free: the maths is
 * unit-tested, the DOM helpers run in the browser.
 *
 * A page is split into segments by its anchors (sections and prose headings
 * with an `id`, in document order); a virtual segment runs from the top of the
 * page to the first anchor. The place is the segment at the top of the viewport
 * and how far into it the reader is, as a fraction, so it survives the other
 * language's different text lengths. Case-study headings have translated ids,
 * so an anchor is also matched by its position when both pages have the same
 * number of anchors; otherwise the place falls back to a fraction of the page.
 */

export const PLACE_KEY = 'reading-place';
/** A stored place older than this is ignored (the switch was not followed by this page load). */
export const PLACE_MAX_AGE_MS = 10_000;
/** Section containers and prose headings that split a page into segments. */
export const ANCHOR_SELECTOR = 'main section[id], main .case-prose h2[id]';

export interface Anchor {
  id: string;
  /** Top edge in document coordinates (px). */
  top: number;
}

export interface ReadingPlace {
  /** Pathname of the page the place is meant for. */
  path: string;
  /** Anchor id at the top of the viewport; '' for the segment before the first anchor. */
  id: string;
  /** Position of that anchor among all anchors (-1 before the first). */
  index: number;
  /** Number of anchors on the page the place was taken from. */
  count: number;
  /** How far into the segment (0..1). */
  fraction: number;
  /** How far into the whole scrollable page (0..1). */
  pageFraction: number;
  time: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Start and end (document px) of segment `index`; -1 is the part before the first anchor. */
export function segmentBounds(anchors: Anchor[], index: number, pageHeight: number): [number, number] {
  const start = index < 0 ? 0 : anchors[index].top;
  const end = index + 1 < anchors.length ? anchors[index + 1].top : pageHeight;
  return [start, Math.max(end, start + 1)];
}

/** Where the reader is: `scrollY` measured against sorted `anchors`. */
export function measurePlace(anchors: Anchor[], scrollY: number, pageHeight: number, viewportHeight: number, path: string, time: number): ReadingPlace {
  let index = -1;
  anchors.forEach((anchor, position) => {
    if (anchor.top <= scrollY + 1) index = position;
  });
  const [start, end] = segmentBounds(anchors, index, pageHeight);
  const scrollable = Math.max(1, pageHeight - viewportHeight);
  return {
    path,
    id: index < 0 ? '' : anchors[index].id,
    index,
    count: anchors.length,
    fraction: clamp01((scrollY - start) / (end - start)),
    pageFraction: clamp01(scrollY / scrollable),
    time,
  };
}

/**
 * The scroll position on this page for a stored `place`, or null when the
 * place is stale or for another page.
 */
export function resolvePlace(place: ReadingPlace, anchors: Anchor[], pageHeight: number, viewportHeight: number, path: string, now: number): number | null {
  if (place.path !== path || !(now - place.time >= 0 && now - place.time <= PLACE_MAX_AGE_MS)) return null;
  let index: number | undefined;
  if (place.index < 0) index = -1;
  else {
    const byId = anchors.findIndex((anchor) => anchor.id === place.id);
    if (byId >= 0) index = byId;
    else if (place.count === anchors.length) index = place.index;
  }
  if (index === undefined) return Math.round(clamp01(place.pageFraction) * Math.max(0, pageHeight - viewportHeight));
  const [start, end] = segmentBounds(anchors, index, pageHeight);
  return Math.round(start + clamp01(place.fraction) * (end - start));
}

/** A stored place, if it parses; anything else is null. */
export function parsePlace(raw: string | null): ReadingPlace | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ReadingPlace>;
    const numbers = [value.index, value.count, value.fraction, value.pageFraction, value.time];
    if (typeof value.path !== 'string' || typeof value.id !== 'string' || numbers.some((number) => typeof number !== 'number' || !Number.isFinite(number))) return null;
    return value as ReadingPlace;
  } catch {
    return null;
  }
}

/** Anchors of the current page in document coordinates; a pinned section is measured by its pin spacer. */
export function pageAnchors(): Anchor[] {
  return [...document.querySelectorAll<HTMLElement>(ANCHOR_SELECTOR)]
    .filter((element) => element.getClientRects().length > 0)
    .map((element) => {
      const box = (element.parentElement?.classList.contains('pin-spacer') ? element.parentElement : element).getBoundingClientRect();
      return { id: element.id, top: box.top + window.scrollY };
    })
    .sort((first, second) => first.top - second.top);
}

const pageHeight = () => document.documentElement.scrollHeight;

/** Remember where the reader is, for the page at `targetPath` (called on a language switch click). */
export function rememberPlace(targetPath: string): void {
  const place = measurePlace(pageAnchors(), window.scrollY, pageHeight(), window.innerHeight, targetPath, Date.now());
  try {
    sessionStorage.setItem(PLACE_KEY, JSON.stringify(place));
  } catch {
    // Storage blocked (private mode, sandbox): the other page simply opens at the top.
  }
}

/** Takes (and forgets) a stored place for this page; returns the scroll position, or null. */
export function takePlace(): number | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(PLACE_KEY);
    if (raw) sessionStorage.removeItem(PLACE_KEY);
  } catch {
    return null;
  }
  const place = parsePlace(raw);
  if (!place) return null;
  return resolvePlace(place, pageAnchors(), pageHeight(), window.innerHeight, location.pathname, Date.now());
}
