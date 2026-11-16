import { gsap, prefersReducedMotion } from './lifecycle';
import { cardPose, positionLabel, rotateDeck, shouldDismiss, unrotateDeck } from './deck-model';

export { rotateDeck, unrotateDeck, cardPose, shouldDismiss } from './deck-model';

/**
 * Recommendations deck. `root` is the section: it holds `.deck` (the cards,
 * `.quote`), the `.prev-quote` / `.next-quote` buttons and a polite
 * `.deck-announce` region. Cards stack in one grid cell, so the deck is always
 * as tall as its longest quote. The top card is the only one exposed to
 * assistive tech (the others are inert and aria-hidden). Previous / Next, the
 * Left / Right arrow keys (on the buttons or the focusable deck) and a drag
 * change the card; the change is announced as "Recommendation 2 of 3" plus the
 * quote, and focus stays where it was.
 */
export function initDeck(root: HTMLElement): () => void {
  const deck = root.querySelector<HTMLElement>('.deck');
  const next = root.querySelector<HTMLButtonElement>('.next-quote');
  const previous = root.querySelector<HTMLButtonElement>('.prev-quote');
  const controls = root.querySelector<HTMLElement>('.deck-controls');
  const announcer = root.querySelector<HTMLElement>('.deck-announce');
  const cards = deck ? [...deck.querySelectorAll<HTMLElement>('.quote')] : [];
  if (!deck || !next || cards.length < 2) return () => {};

  const reduced = prefersReducedMotion();
  let order = [...cards];
  let announce = false;

  root.classList.add('deck-on');
  const hint = root.querySelector<HTMLElement>('.reco-hint');
  const originalHint = hint?.textContent ?? '';
  if (reduced) {
    root.classList.add('deck-still');
    if (hint?.dataset.reduced) hint.textContent = hint.dataset.reduced;
  }

  const expose = () => {
    order.forEach((card, index) => {
      card.toggleAttribute('inert', index !== 0);
      if (index === 0) card.removeAttribute('aria-hidden');
      else card.setAttribute('aria-hidden', 'true');
    });
    if (announce && announcer) {
      const top = order[0];
      const position = positionLabel(announcer.dataset.template ?? '{current}/{total}', cards.indexOf(top) + 1, cards.length);
      const name = top.querySelector('figcaption b')?.textContent ?? '';
      const role = top.querySelector('figcaption span')?.textContent ?? '';
      announcer.textContent = `${position}: ${name}, ${role}. ${top.querySelector('blockquote')?.textContent ?? ''}`;
    }
  };

  const layout = (duration: number, skip?: HTMLElement) => {
    order.forEach((card, index) => {
      if (card === skip) return;
      const pose = cardPose(index, order.length);
      if (duration === 0 || reduced) gsap.set(card, { ...pose, opacity: 1 });
      else gsap.to(card, { ...pose, opacity: 1, duration, ease: 'power3.out', overwrite: true });
    });
  };

  const advance = (direction: number) => {
    const top = order[0];
    order = rotateDeck(order);
    announce = true;
    expose();
    if (reduced) {
      layout(0);
      return;
    }
    gsap.killTweensOf(top);
    gsap.set(top, { zIndex: order.length + 1 });
    gsap.to(top, {
      x: direction * Math.min(window.innerWidth * 0.7, 700),
      rotation: direction * 24,
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => {
        const index = order.indexOf(top);
        gsap.set(top, { ...cardPose(index, order.length), opacity: 0 });
        gsap.to(top, { opacity: 1, duration: 0.3, overwrite: true });
      },
    });
    layout(0.5, top);
  };

  // Previous: the card at the back comes in from the left and lands on top.
  const retreat = () => {
    const incoming = order[order.length - 1];
    order = unrotateDeck(order);
    announce = true;
    expose();
    if (reduced) {
      layout(0);
      return;
    }
    gsap.killTweensOf(incoming);
    gsap.set(incoming, { zIndex: order.length + 1 });
    gsap.fromTo(
      incoming,
      { x: -Math.min(window.innerWidth * 0.7, 700), y: 0, rotation: -24, scale: 1, opacity: 0 },
      { ...cardPose(0, order.length), opacity: 1, duration: 0.45, ease: 'power3.out', overwrite: true },
    );
    layout(0.5, incoming);
  };

  const onNext = () => advance(1);
  const onPrevious = () => retreat();
  next.addEventListener('click', onNext);
  previous?.addEventListener('click', onPrevious);

  // Arrow keys while focus is on the deck or its buttons.
  deck.tabIndex = 0;
  const onKey = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target as Node;
    if (!deck.contains(target) && !controls?.contains(target)) return;
    if (event.key === 'ArrowRight') advance(1);
    else if (event.key === 'ArrowLeft') retreat();
    else return;
    event.preventDefault();
  };
  root.addEventListener('keydown', onKey);

  // Drag: only the top card, pointer capture, vertical scroll stays native (touch-action: pan-y).
  let dragging: { card: HTMLElement; startX: number; startY: number; deltaX: number; pointerId: number } | null = null;

  const onDown = (event: PointerEvent) => {
    const card = (event.target as Element).closest<HTMLElement>('.quote');
    if (reduced || !card || card !== order[0] || (event.pointerType === 'mouse' && event.button !== 0)) return;
    dragging = { card, startX: event.clientX, startY: event.clientY, deltaX: 0, pointerId: event.pointerId };
    gsap.killTweensOf(card);
    card.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    dragging.deltaX = event.clientX - dragging.startX;
    gsap.set(dragging.card, { x: dragging.deltaX, y: (event.clientY - dragging.startY) * 0.4, rotation: dragging.deltaX * 0.06 });
  };
  const onUp = (event: PointerEvent) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    const { card, deltaX } = dragging;
    dragging = null;
    if (card.hasPointerCapture(event.pointerId)) card.releasePointerCapture(event.pointerId);
    if (event.type === 'pointerup' && shouldDismiss(deltaX)) advance(Math.sign(deltaX));
    else gsap.to(card, { x: 0, y: 0, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)', overwrite: true });
  };
  deck.addEventListener('pointerdown', onDown);
  deck.addEventListener('pointermove', onMove);
  deck.addEventListener('pointerup', onUp);
  deck.addEventListener('pointercancel', onUp);

  expose();
  layout(0);

  return () => {
    next.removeEventListener('click', onNext);
    previous?.removeEventListener('click', onPrevious);
    root.removeEventListener('keydown', onKey);
    deck.removeAttribute('tabindex');
    deck.removeEventListener('pointerdown', onDown);
    deck.removeEventListener('pointermove', onMove);
    deck.removeEventListener('pointerup', onUp);
    deck.removeEventListener('pointercancel', onUp);
    gsap.killTweensOf(cards);
    gsap.set(cards, { clearProps: 'all' });
    cards.forEach((card) => {
      card.removeAttribute('inert');
      card.removeAttribute('aria-hidden');
    });
    if (announcer) announcer.textContent = '';
    root.classList.remove('deck-on', 'deck-still');
    if (hint) hint.textContent = originalHint;
  };
}
