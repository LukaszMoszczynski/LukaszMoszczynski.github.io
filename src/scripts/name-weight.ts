import { gsap, hasFinePointer, motionEnabled, quietArrival } from './lifecycle';

/** Variable-font weight for a letter at `distance` px from the pointer. */
export function weightForDistance(distance: number, radius = 260, min = 300, max = 900): number {
  return Math.round(min + (max - min) * Math.max(0, 1 - distance / radius));
}

/** Rounds a weight to `step` so small pointer moves do not restyle every letter. */
export function snapWeight(weight: number, step = 50): number {
  return Math.round(weight / step) * step;
}

/**
 * Hero behaviour: lines drifting apart on scroll, and letters getting heavier
 * near a fine pointer. Returns cleanup.
 *
 * The rise-in is a CSS animation (Hero.astro) that starts with the first paint.
 */
export function initHero(root: HTMLElement): () => void {
  const chars = [...root.querySelectorAll<HTMLElement>('.name .char')];
  const lines = root.querySelectorAll<HTMLElement>('.name .line');

  // Letter centres are cached: measuring every letter on every move forced a layout per letter.
  let centres: Array<{ x: number; y: number }> = [];
  let stale = true;
  const markStale = () => {
    stale = true;
  };

  if (motionEnabled()) {
    // After a language switch the name is already there: no second rise-in. The rise-in itself is CSS
    // (Hero.astro); `still` keeps it off once the quiet-arrival class leaves <html>.
    if (quietArrival()) root.classList.add('still');
    const scrub = { trigger: root, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to(lines[0], { xPercent: -8, ease: 'none', scrollTrigger: scrub });
    gsap.to(lines[1], { xPercent: 6, ease: 'none', scrollTrigger: { ...scrub } });
  }

  if (!motionEnabled() || !hasFinePointer()) return () => {};

  const written = chars.map(() => 0);
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;
  let alive = true;

  const render = () => {
    frame = 0;
    // Reads first (only when something moved the letters)…
    if (stale) {
      centres = chars.map((char) => {
        const box = char.getBoundingClientRect();
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      });
      stale = false;
    }
    // …then writes, and only for letters whose weight changed.
    chars.forEach((char, index) => {
      const centre = centres[index];
      const weight = snapWeight(weightForDistance(Math.hypot(pointerX - centre.x, pointerY - centre.y)));
      if (weight === written[index]) return;
      written[index] = weight;
      char.style.fontWeight = String(weight);
    });
  };
  const onMove = (event: PointerEvent) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = requestAnimationFrame(render);
  };
  const onLeave = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    chars.forEach((char, index) => {
      written[index] = 0;
      char.style.fontWeight = '';
    });
  };

  document.fonts?.ready.then(() => {
    if (alive) markStale();
  });
  // The letters moved: the CSS rise-in ended.
  root.addEventListener('animationend', markStale);
  root.addEventListener('pointerenter', markStale);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerleave', onLeave);
  window.addEventListener('scroll', markStale, { passive: true });
  window.addEventListener('resize', markStale);
  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    root.removeEventListener('animationend', markStale);
    root.removeEventListener('pointerenter', markStale);
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('scroll', markStale);
    window.removeEventListener('resize', markStale);
  };
}
