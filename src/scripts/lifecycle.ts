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

/**
 * Runs `setup` on every `astro:page-load`. Its cleanup, and every tween and
 * ScrollTrigger created during that page (tracked by a gsap.context), run on
 * `astro:before-swap`.
 */
export function onPage(setup: Setup): void {
  let context: gsap.Context | undefined;
  let cleanup: (() => void) | void;

  const teardown = () => {
    cleanup?.();
    cleanup = undefined;
    context?.revert();
    context = undefined;
  };

  document.addEventListener('astro:page-load', () => {
    teardown();
    context = gsap.context(() => {
      cleanup = setup();
    });
  });
  document.addEventListener('astro:before-swap', teardown);
}
