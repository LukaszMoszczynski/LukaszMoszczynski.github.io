/**
 * While a view transition plays (about 0.3–0.7 s after a language switch or any other
 * client-side navigation), the browser hit-tests every pointer event to <html>: the page is
 * shown through the ::view-transition overlay and cannot be clicked, whatever CSS says.
 * A click on the theme switch in that window used to vanish (and set off a background burst).
 *
 * The header controls are fixed, so they sit at the same spot before, during and after the
 * transition. A click that lands on <html> during a transition is held back, and once the
 * transition has finished it is replayed on the header control now under that point, if any.
 * Clicks elsewhere are dropped as before: page content may have scrolled underneath.
 */

/** Fixed header controls whose swallowed clicks are replayed. */
export const REPLAYABLE = '[data-theme-toggle], [data-lang-switch], .menu-toggle';
/** A held click older than this is stale and dropped instead of replayed. */
export const MAX_AGE_MS = 2000;
/** Astro sets this on <html> from the start of a navigation's transition until it has finished. */
const TRANSITION_ATTR = 'data-astro-transition';

interface HeldClick { x: number; y: number; time: number }

/** The control to replay a held-back click on, or null when the point is not over one. */
export function replayTarget(hit: Element | null): HTMLElement | null {
  return hit?.closest<HTMLElement>(REPLAYABLE) ?? null;
}

let installed = false;

export function installTransitionClickReplay(): void {
  if (installed) return;
  installed = true;
  const root = document.documentElement;
  let held: HeldClick | null = null;

  document.addEventListener('click', (event) => {
    if (event.target !== root || !root.hasAttribute(TRANSITION_ATTR)) return;
    // Held back: this also keeps the background from treating it as a click on the empty grid.
    event.stopPropagation();
    held = { x: event.clientX, y: event.clientY, time: performance.now() };
  }, { capture: true });

  document.addEventListener('astro:before-swap', (event) => {
    const transition = (event as Event & { viewTransition?: { finished: Promise<void> } }).viewTransition;
    transition?.finished.catch(() => {}).finally(() => {
      if (!held) return;
      const fresh = performance.now() - held.time < MAX_AGE_MS;
      const hit = document.elementFromPoint(held.x, held.y);
      // Still covered (a newer navigation took over): that transition replays it when it ends.
      if (hit === root && fresh) return;
      held = null;
      if (fresh) replayTarget(hit)?.click();
    });
  });
}
