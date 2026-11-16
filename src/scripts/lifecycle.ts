import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function hasFinePointer(): boolean {
  return matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** GSAP is bundled, so it is always loaded when this runs. */
export function motionEnabled(): boolean {
  return !prefersReducedMotion();
}

type Setup = () => (() => void) | void;

interface Registered {
  setup: Setup;
  context?: gsap.Context;
  cleanup?: (() => void) | void;
}

const registry: Registered[] = [];
let navigationType: 'push' | 'replace' | 'traverse' | 'initial' = 'initial';

/** Class the head script puts on <html> until every section has set itself up (see BaseLayout). */
export const INIT_PENDING_CLASS = 'init-pending';

function teardown(entry: Registered): void {
  entry.cleanup?.();
  entry.cleanup = undefined;
  entry.context?.revert();
  entry.context = undefined;
}

/**
 * Section setups change layout (pin spacers, a collapsed deck), but Astro and
 * the browser scroll to a hash or a saved position before they run. Once all
 * of them ran, re-measure ScrollTrigger and put the reader back where they
 * were going.
 */
function restoreScroll(): void {
  ScrollTrigger.refresh();
  let hash = location.hash.slice(1);
  try {
    hash = decodeURIComponent(hash);
  } catch {
    // Malformed escape such as "#%": keep the raw value instead of throwing.
  }
  const target = hash ? document.getElementById(hash) : null;
  if (target) {
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
    return;
  }
  // Back/forward and reloads: Astro's router keeps the position in history.state.
  const saved = history.state as { scrollX?: number; scrollY?: number } | null;
  if ((navigationType === 'traverse' || navigationType === 'initial') && typeof saved?.scrollY === 'number') {
    window.scrollTo({ left: saved.scrollX ?? 0, top: saved.scrollY, behavior: 'instant' });
  }
}

function runAll(): void {
  for (const entry of registry) {
    teardown(entry);
    try {
      entry.context = gsap.context(() => {
        entry.cleanup = entry.setup();
      });
    } catch (error) {
      // One broken section must not leave the others (or the page) half set up.
      console.error(error);
    }
  }
  restoreScroll();
  document.documentElement.classList.remove(INIT_PENDING_CLASS);
}

if (typeof document !== 'undefined') {
  document.addEventListener('astro:before-preparation', (event) => {
    navigationType = (event as Event & { navigationType: typeof navigationType }).navigationType;
  });
  document.addEventListener('astro:page-load', runAll);
  document.addEventListener('astro:before-swap', () => registry.forEach(teardown));
}

/**
 * Runs `setup` on every `astro:page-load`. Its cleanup, and every tween and
 * ScrollTrigger created during that page (tracked by a gsap.context), run on
 * `astro:before-swap`. After all setups of a page ran, ScrollTrigger is
 * refreshed and the hash target or saved scroll position is restored.
 */
export function onPage(setup: Setup): void {
  registry.push({ setup });
}
