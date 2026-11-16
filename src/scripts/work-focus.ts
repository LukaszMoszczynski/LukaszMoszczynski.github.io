/**
 * Keyboard focus in Selected work. GSAP-free (the maths is unit-tested).
 *
 * On wide screens the cards are sticky and stack over each other, so a card
 * that gets focus can sit, at its sticky top, completely under a later card:
 * the browser sees its link "in view" and does not scroll. On phones a card is
 * taller than the bit the browser scrolls into view, so its visual is cut off.
 * When a card's link gets keyboard focus, scroll so the whole card is in view:
 * a stacked card goes to its resting place (at its sticky top, before the next
 * card slides over it), any other card is brought fully below the header.
 */

/** Sticky top of card `index`, in px: 88, 104, 120… (must match WorkStack.astro). */
export function stickyTop(index: number): number {
  return 88 + index * 16;
}

/** Same media query as the sticky rule in WorkStack.astro. */
export const STACK_MEDIA = '(min-width: 861px) and (min-height: 640px)';
/** Space kept clear under the fixed header (its 80px plus a little air). */
export const HEADER_CLEARANCE = 88;
/** Air kept below a card at the bottom of the viewport. */
const BOTTOM_MARGIN = 16;

export interface CardFrame {
  /** Index of the card in the stack. */
  index: number;
  /** Top of the card in document px as laid out, ignoring sticky offsets and transforms. */
  naturalTop: number;
  height: number;
}

export interface Viewport {
  scrollY: number;
  height: number;
  stacked: boolean;
}

/** Scroll position that shows the whole card, or null when it is already fully shown. */
export function focusScrollTarget(card: CardFrame, view: Viewport): number | null {
  let target: number;
  if (view.stacked) {
    target = card.naturalTop - stickyTop(card.index);
  } else {
    const top = card.naturalTop - view.scrollY;
    const bottom = top + card.height;
    const room = view.height - BOTTOM_MARGIN - HEADER_CLEARANCE;
    if (card.height > room || top < HEADER_CLEARANCE) target = card.naturalTop - HEADER_CLEARANCE;
    else if (bottom > view.height - BOTTOM_MARGIN) target = card.naturalTop + card.height - (view.height - BOTTOM_MARGIN);
    else return null;
  }
  target = Math.max(0, Math.round(target));
  return Math.abs(target - view.scrollY) < 1 ? null : target;
}

/**
 * Natural tops of the cards: the stack is one grid column, so each card starts
 * where the one before it ends plus the row gap (sticky offsets and the scrubbed
 * scale do not change layout).
 */
function cardFrames(stack: HTMLElement, cards: HTMLElement[]): CardFrame[] {
  const gap = parseFloat(getComputedStyle(stack).rowGap) || 0;
  let top = stack.getBoundingClientRect().top + window.scrollY;
  return cards.map((card, index) => {
    const frame = { index, naturalTop: top, height: card.offsetHeight };
    top += card.offsetHeight + gap;
    return frame;
  });
}

/** Runs with and without motion; the scroll is always instant (no fight with the scrubbed stack). */
export function initWorkFocus(root: HTMLElement): () => void {
  const stack = root.querySelector<HTMLElement>('.work-stack');
  const cards = [...root.querySelectorAll<HTMLElement>('.project-card')];
  if (!stack || !cards.length) return () => {};
  let frame = 0;

  const reveal = (card: HTMLElement) => {
    const index = cards.indexOf(card);
    const target = focusScrollTarget(cardFrames(stack, cards)[index], {
      scrollY: window.scrollY,
      height: window.innerHeight,
      stacked: matchMedia(STACK_MEDIA).matches,
    });
    if (target !== null) window.scrollTo({ top: target, behavior: 'instant' });
  };

  const onFocusIn = (event: FocusEvent) => {
    const element = event.target as HTMLElement;
    const card = element.closest<HTMLElement>('.project-card');
    // Keyboard only: a pointer click must not move the page under the pointer.
    if (!card || !element.matches(':focus-visible')) return;
    reveal(card);
    // The browser may still scroll the focused link into view after this event; check once more.
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (card.contains(document.activeElement)) reveal(card);
    });
  };

  root.addEventListener('focusin', onFocusIn);
  return () => {
    root.removeEventListener('focusin', onFocusIn);
    cancelAnimationFrame(frame);
  };
}
