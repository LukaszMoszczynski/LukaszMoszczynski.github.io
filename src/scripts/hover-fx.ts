import { gsap, hasFinePointer, motionEnabled } from './lifecycle';

/** How far (px) a pill leans toward a fine pointer. */
export const MAGNET_MAX = 6;
/** Pills that lean toward the pointer and press on click; the wipe and arrow fly are CSS (global.css). */
const PILLS = '.fx-pill';

/** Pull toward the pointer, `MAGNET_MAX` px at the pill's edge, 0 at its centre. */
export function magnetOffset(pointer: number, start: number, size: number, max: number = MAGNET_MAX): number {
  if (size <= 0) return 0;
  const ratio = ((pointer - start) / size) * 2 - 1;
  return Math.max(-1, Math.min(1, ratio)) * max;
}

/**
 * Site-wide hover effects, set up once per page through `onPage`:
 * `.fx-pill` elements get the wipe origin from the side the pointer enters (--fx-x / --fx-y),
 * a short press on pointerdown, and a magnetic lean on a fine pointer.
 * Without motion nothing runs here; CSS keeps a plain colour change.
 */
export function initHoverFx(): () => void {
  if (!motionEnabled()) return () => {};
  const removers: Array<() => void> = [];
  const listen = <K extends keyof HTMLElementEventMap>(element: HTMLElement, type: K, handler: (event: HTMLElementEventMap[K]) => void) => {
    element.addEventListener(type, handler);
    removers.push(() => element.removeEventListener(type, handler));
  };
  const fine = hasFinePointer();
  const pills = [...document.querySelectorAll<HTMLElement>(PILLS)];

  for (const pill of pills) {
    const origin = (event: PointerEvent) => {
      const box = pill.getBoundingClientRect();
      pill.style.setProperty('--fx-x', `${Math.round(((event.clientX - box.left) / Math.max(box.width, 1)) * 100)}%`);
      pill.style.setProperty('--fx-y', `${Math.round(((event.clientY - box.top) / Math.max(box.height, 1)) * 100)}%`);
    };
    listen(pill, 'pointerenter', origin);
    listen(pill, 'pointerleave', origin);
    listen(pill, 'pointerdown', (event) => {
      origin(event);
      gsap.to(pill, { scale: 0.95, duration: 0.12, ease: 'power2.out', overwrite: 'auto' });
    });
    const release = () => gsap.to(pill, { scale: 1, duration: 0.4, ease: 'back.out(3)', overwrite: 'auto' });
    listen(pill, 'pointerup', release);
    listen(pill, 'pointercancel', release);

    if (fine) {
      const moveX = gsap.quickTo(pill, 'x', { duration: 0.4, ease: 'power3' });
      const moveY = gsap.quickTo(pill, 'y', { duration: 0.4, ease: 'power3' });
      listen(pill, 'pointermove', (event) => {
        // A pill's box moves with the lean; measure without it so the pull does not feed on itself.
        const box = pill.getBoundingClientRect();
        const x = Number(gsap.getProperty(pill, 'x'));
        const y = Number(gsap.getProperty(pill, 'y'));
        moveX(magnetOffset(event.clientX, box.left - x, box.width));
        moveY(magnetOffset(event.clientY, box.top - y, box.height));
      });
      listen(pill, 'pointerleave', () => {
        moveX(0);
        moveY(0);
        release();
      });
    } else {
      listen(pill, 'pointerleave', release);
    }
  }

  return () => {
    removers.forEach((remove) => remove());
    gsap.killTweensOf(pills);
    gsap.set(pills, { clearProps: 'transform' });
    pills.forEach((pill) => {
      pill.style.removeProperty('--fx-x');
      pill.style.removeProperty('--fx-y');
    });
  };
}
