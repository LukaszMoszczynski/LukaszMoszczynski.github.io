import { gsap, hasFinePointer, motionEnabled } from './lifecycle';

/** Class on <html> while the custom cursor runs; only then is the native cursor hidden (CSS in BaseLayout). */
export const CURSOR_CLASS = 'has-cursor';

export type CursorState = 'default' | 'link' | 'open' | 'drag' | 'text';

/** Where the native text cursor is the right one: the custom cursor hides there. */
const TEXT_INPUT = 'input:not([type=button], [type=submit], [type=reset], [type=checkbox], [type=radio]), textarea, select, [contenteditable]:not([contenteditable=false])';
/** Project cards on the home stack and on /work/: a click anywhere opens the case study. */
const CARD = '.project-card, .work-index-card';
/** The recommendations deck while it can be dragged. */
const DRAG = '.reco.deck-on:not(.deck-still) .quote';
const INTERACTIVE = 'a[href], button, [role=button], [role=switch], label, summary, .fx-pill';

/** What the cursor should show over `target` (most specific first). */
export function cursorState(target: Element | null): CursorState {
  if (!target) return 'default';
  if (target.closest(TEXT_INPUT)) return 'text';
  if (target.closest(DRAG)) return 'drag';
  // On a card everything opens it (card-links.ts), except its own buttons, which still read as links.
  const card = target.closest(CARD);
  const control = target.closest(INTERACTIVE);
  if (card && (!control || control.matches('a[href]'))) return 'open';
  if (control) return 'link';
  return 'default';
}

let started = false;

/**
 * Blueprint cursor: an orange dot exactly on the pointer and a thin ring with four crosshair
 * ticks that follows with a short lag. Over links and buttons the ring grows, fills and the
 * ticks turn 45°; over project cards it becomes an "Open" pill, over the deck a "Drag" pill;
 * pressing shrinks it; it hides outside the window and over text inputs (native text cursor).
 * Only for a fine pointer with motion allowed; otherwise nothing is added. The markup is
 * `transition:persist`, so this runs once per full page load.
 */
export function initCursor(): void {
  if (started) return;
  const root = document.querySelector<HTMLElement>('.cursor');
  const ring = root?.querySelector<HTMLElement>('.cursor-ring');
  const dot = root?.querySelector<HTMLElement>('.cursor-dot');
  const label = root?.querySelector<HTMLElement>('.cursor-label');
  if (!root || !ring || !dot || !label || !hasFinePointer() || !motionEnabled()) return;
  started = true;

  const html = document.documentElement;
  html.classList.add(CURSOR_CLASS);
  // The router copies <html> attributes from the incoming page: keep the class on it.
  document.addEventListener('astro:before-swap', (event) => {
    (event as Event & { newDocument: Document }).newDocument.documentElement.classList.add(CURSOR_CLASS);
  });

  const ringX = gsap.quickTo(ring, 'x', { duration: 0.18, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.18, ease: 'power3' });
  const dotX = gsap.quickSetter(dot, 'x', 'px');
  const dotY = gsap.quickSetter(dot, 'y', 'px');
  let seen = false;

  const setState = (state: CursorState) => {
    if (root.dataset.state === state) return;
    root.dataset.state = state;
    const strings = document.body.dataset;
    label.textContent = state === 'open' ? strings.cursorOpen ?? '' : state === 'drag' ? strings.cursorDrag ?? '' : '';
  };
  setState('default');

  // Transforms only: no reads of layout here.
  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    dotX(event.clientX);
    dotY(event.clientY);
    if (!seen) {
      seen = true;
      gsap.set(ring, { x: event.clientX, y: event.clientY });
    }
    ringX(event.clientX);
    ringY(event.clientY);
    root.classList.add('is-visible');
  }, { passive: true });

  document.addEventListener('pointerover', (event) => {
    setState(cursorState(event.target instanceof Element ? event.target : null));
  }, { passive: true });
  document.addEventListener('pointerdown', () => root.classList.add('is-pressed'), { passive: true });
  document.addEventListener('pointerup', () => root.classList.remove('is-pressed'), { passive: true });
  document.addEventListener('pointercancel', () => root.classList.remove('is-pressed'), { passive: true });
  html.addEventListener('pointerleave', () => root.classList.remove('is-visible', 'is-pressed'));
  html.addEventListener('pointerenter', () => { if (seen) root.classList.add('is-visible'); });
  // A new page under a still pointer: forget the old element's state until the next move.
  document.addEventListener('astro:after-swap', () => setState('default'));
}
