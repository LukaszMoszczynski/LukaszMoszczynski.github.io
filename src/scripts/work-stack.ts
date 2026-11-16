import { gsap, hasFinePointer } from './lifecycle';
import { STACK_MEDIA, stickyTop } from './work-focus';

export { STACK_MEDIA, stickyTop } from './work-focus';
const MAX_TILT = 14;

/**
 * Selected work. Call only with motion enabled.
 * - Stacked cards (wide, tall screens, where the cards are sticky): each card
 *   shrinks and dims, scrubbed, while the next one slides over it.
 * - Fine pointers: the project visual tilts in 3D under the pointer.
 * Cleanup reverts the media tweens and removes the pointer listeners.
 */
export function initWorkStack(root: HTMLElement): () => void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.project-card'));
  const media = gsap.matchMedia();
  media.add(STACK_MEDIA, () => {
    cards.forEach((card, index) => {
      const next = cards[index + 1];
      if (!next) return;
      // The card's surface stays opaque so cards further down the stack never
      // show through; only its content dims.
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: next, start: 'top bottom', end: `top ${stickyTop(index + 1)}px`, scrub: true },
        })
        .to(card, { scale: 0.92 }, 0)
        .to(card.children, { opacity: 0.55 }, 0);
    });
  });

  const removers: (() => void)[] = [];
  if (hasFinePointer()) {
    root.querySelectorAll<HTMLElement>('.project-visual').forEach((visual) => {
      const screen = visual.querySelector<HTMLElement>('.project-screen');
      if (!screen) return;
      const tiltX = gsap.quickTo(screen, 'rotationX', { duration: 0.35, ease: 'power3.out' });
      const tiltY = gsap.quickTo(screen, 'rotationY', { duration: 0.35, ease: 'power3.out' });
      const grow = gsap.quickTo(screen, 'scale', { duration: 0.35, ease: 'power3.out' });
      const onMove = (event: PointerEvent) => {
        const box = visual.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        tiltY(x * MAX_TILT * 2);
        tiltX(-y * MAX_TILT * 2);
        grow(1.02);
      };
      const onLeave = () => {
        tiltX(0);
        tiltY(0);
        grow(1);
      };
      visual.addEventListener('pointermove', onMove);
      visual.addEventListener('pointerleave', onLeave);
      removers.push(() => {
        visual.removeEventListener('pointermove', onMove);
        visual.removeEventListener('pointerleave', onLeave);
        gsap.killTweensOf(screen);
        gsap.set(screen, { clearProps: 'transform' });
      });
    });
  }

  return () => {
    removers.forEach((remove) => remove());
    media.revert();
  };
}
