import { gsap, motionEnabled, ScrollTrigger } from './lifecycle';

/** [left %, top %, width %, height %, border-radius px] of one piece in the frame. */
export type PieceState = [left: number, top: number, width: number, height: number, radius: number];

/** 4 steps (atoms, molecules, organisms, page) × 6 pieces (page, violet, type, space, accent, radius). */
export const BUILD_STATES: PieceState[][] = [
  [[68, 10, 26, 34, 14], [37, 10, 26, 34, 14], [6, 10, 26, 34, 14], [6, 56, 26, 34, 14], [37, 56, 26, 34, 14], [68, 56, 26, 34, 999]],
  [[12, 22, 76, 56, 20], [18, 44, 44, 14, 10], [18, 28, 40, 9, 4], [18, 64, 64, 3, 2], [64, 44, 18, 14, 10], [20, 46.5, 5, 9, 999]],
  [[12, 5, 76, 90, 22], [17, 10, 66, 38, 14], [17, 53, 48, 8, 4], [17, 66, 40, 3, 2], [17, 76, 30, 11, 999], [70, 75, 11, 15, 999]],
  [[2, 2, 96, 96, 16], [6, 18, 88, 46, 12], [10, 26, 44, 8, 4], [6, 7, 88, 5, 999], [10, 48, 20, 8, 999], [72, 28, 13, 17, 999]],
];

/** CSS properties for a piece state (also used for the server-rendered inline style). */
export function pieceStyle([left, top, width, height, radius]: PieceState) {
  return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, borderRadius: `${radius}px` };
}

/** Scroll position at which step `index` of `count` sits inside a pin from `start` to `end`. */
export function stepScrollTop(start: number, end: number, index: number, count: number): number {
  return start + ((end - start) * index) / (count - 1);
}

/** How long a click keeps its step active while the smooth scroll travels past the others. */
const CLICK_LOCK_MS = 1600;

/**
 * Pinned "token to page" build: scrubbed timeline through the four states with
 * label snapping, steps as buttons that jump to their state. Without motion the
 * frame keeps its server-rendered page state and steps set states directly.
 */
export function initTokenBuild(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>('.stage');
  const pieces = [...root.querySelectorAll<HTMLElement>('.stage .piece')];
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('.steps button')];
  if (!stage || pieces.length !== 6 || buttons.length !== BUILD_STATES.length) return () => {};
  const tags = root.querySelectorAll<HTMLElement>('.piece .tag');
  const fills = root.querySelectorAll<HTMLElement>('.piece .bar-fill');
  const glyph = root.querySelector<HTMLElement>('.piece .aa');
  const label = root.querySelector<HTMLElement>('.piece .label');
  const last = BUILD_STATES.length - 1;

  let active = -1;
  const setStep = (index: number) => {
    if (index === active) return;
    active = index;
    buttons.forEach((button, buttonIndex) => {
      const on = buttonIndex === index;
      button.classList.toggle('on', on);
      if (on) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  };

  /** Puts the frame straight into a state (no animation). */
  const applyState = (index: number) => {
    pieces.forEach((piece, pieceIndex) => gsap.set(piece, pieceStyle(BUILD_STATES[index][pieceIndex])));
    const assembled = index > 0;
    gsap.set(tags, { opacity: assembled ? 0 : 0.85 });
    gsap.set(fills, { opacity: assembled ? 1 : 0 });
    if (glyph) gsap.set(glyph, { opacity: assembled ? 0 : 1 });
    if (label) gsap.set(label, { opacity: assembled ? 1 : 0 });
  };

  const listeners: Array<[HTMLButtonElement, () => void]> = [];
  const listen = (onClick: (index: number) => void) => {
    buttons.forEach((button, index) => {
      const handler = () => onClick(index);
      button.addEventListener('click', handler);
      listeners.push([button, handler]);
    });
  };
  const removeListeners = () => {
    for (const [button, handler] of listeners) button.removeEventListener('click', handler);
  };

  if (!motionEnabled()) {
    listen((index) => {
      applyState(index);
      setStep(index);
    });
    return removeListeners;
  }

  root.classList.add('is-animated');
  applyState(0);
  setStep(0);

  // Pop-in once when the frame first enters; pieces stay visible until then.
  let popIn: gsap.core.Tween | undefined;
  ScrollTrigger.create({
    trigger: stage,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      popIn = gsap.fromTo(
        pieces,
        { scale: 0, rotate: () => gsap.utils.random(-30, 30) },
        { scale: 1, rotate: 0, duration: 0.55, ease: 'back.out(1.7)', stagger: 0.04, overwrite: 'auto', clearProps: 'scale,rotate,transform' },
      );
    },
  });

  const build = gsap.timeline({ defaults: { ease: 'power2.inOut', duration: 1 } });
  build.addLabel('s0');
  for (let step = 1; step <= last; step++) {
    pieces.forEach((piece, pieceIndex) => build.to(piece, pieceStyle(BUILD_STATES[step][pieceIndex]), `s${step - 1}`));
    if (step === 1) {
      build
        .to(tags, { opacity: 0, duration: 0.4 }, 's0')
        .to(fills, { opacity: 1, duration: 0.6 }, 's0+=0.3');
      if (glyph) build.to(glyph, { opacity: 0, duration: 0.4 }, 's0');
      if (label) build.to(label, { opacity: 1, duration: 0.4 }, 's0+=0.6');
    }
    build.addLabel(`s${step}`);
  }

  let lockedStep = -1;
  let lockUntil = 0;
  const trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: '+=110%',
    pin: true,
    scrub: 0.35,
    animation: build,
    snap: { snapTo: 'labels', duration: { min: 0.2, max: 0.5 }, ease: 'power1.inOut' },
    onUpdate: (self) => {
      const index = Math.round(self.progress * last);
      if (lockedStep >= 0) {
        if (index === lockedStep || performance.now() > lockUntil) lockedStep = -1;
        else return;
      }
      setStep(index);
    },
  });

  listen((index) => {
    lockedStep = index;
    lockUntil = performance.now() + CLICK_LOCK_MS;
    setStep(index);
    window.scrollTo({ top: stepScrollTop(trigger.start, trigger.end, index, BUILD_STATES.length), behavior: 'smooth' });
  });

  return () => {
    removeListeners();
    popIn?.kill();
  };
}
