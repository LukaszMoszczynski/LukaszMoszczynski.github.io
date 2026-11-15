import { gsap, hasFinePointer, motionEnabled } from './lifecycle';

/** Variable-font weight for a letter at `distance` px from the pointer. */
export function weightForDistance(distance: number, radius = 260, min = 300, max = 900): number {
  return Math.round(min + (max - min) * Math.max(0, 1 - distance / radius));
}

/**
 * Hero behaviour: letter rise-in after the grid draws, lines drifting apart on
 * scroll, and letters getting heavier near a fine pointer. Returns cleanup.
 */
export function initHero(root: HTMLElement): () => void {
  const chars = [...root.querySelectorAll<HTMLElement>('.name .char')];
  const lines = root.querySelectorAll<HTMLElement>('.name .line');
  const reveal = root.querySelectorAll<HTMLElement>('.eyebrow, .claim, .sub, .grid-hint');

  if (motionEnabled()) {
    gsap.from(chars, { yPercent: 120, rotate: 10, duration: 1.2, ease: 'expo.out', stagger: 0.035, delay: 0.4 });
    gsap.from(reveal, { y: 18, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.8 });
    const scrub = { trigger: root, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to(lines[0], { xPercent: -8, ease: 'none', scrollTrigger: scrub });
    gsap.to(lines[1], { xPercent: 6, ease: 'none', scrollTrigger: { ...scrub } });
  }

  if (!motionEnabled() || !hasFinePointer()) return () => {};

  let frame = 0;
  const onMove = (event: PointerEvent) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      for (const char of chars) {
        const box = char.getBoundingClientRect();
        const distance = Math.hypot(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2));
        char.style.fontWeight = String(weightForDistance(distance));
      }
    });
  };
  const onLeave = () => {
    cancelAnimationFrame(frame);
    for (const char of chars) char.style.fontWeight = '';
  };
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerleave', onLeave);
  return () => {
    cancelAnimationFrame(frame);
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerleave', onLeave);
  };
}
