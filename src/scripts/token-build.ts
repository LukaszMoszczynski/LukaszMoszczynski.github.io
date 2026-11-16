import { gsap, motionEnabled, ScrollTrigger } from './lifecycle';

/** [left %, top %, width %, height %, border-radius px, opacity (default 1)] of one piece in the frame. */
export type PieceState = [left: number, top: number, width: number, height: number, radius: number, opacity?: number];

/** The steps, in order: raw tokens first, then the atoms built from them. */
export const BUILD_STEPS = ['tokens', 'atoms', 'molecules', 'organisms', 'pages'] as const;

/**
 * 5 steps × 6 pieces (page, violet, type, space, accent, radius).
 * Atoms: page = checkbox, violet = input, type = chip, accent = button, radius = icon button;
 * the space token has no atom of its own and waits, hidden, where it becomes the divider.
 */
export const BUILD_STATES: PieceState[][] = [
  [[68, 9, 26, 30, 14], [37, 9, 26, 30, 14], [6, 9, 26, 30, 14], [6, 54, 26, 30, 14], [37, 54, 26, 30, 14], [70, 54, 22.5, 30, 999]],
  [[72, 62, 10.5, 14, 8], [6, 20, 56, 18, 12], [6, 63, 26, 12, 999], [18, 64, 64, 3, 2, 0], [68, 20, 26, 18, 12], [42, 59, 15, 20, 999]],
  [[12, 22, 76, 56, 20], [18, 44, 44, 14, 10], [18, 28, 40, 9, 4], [18, 64, 64, 3, 2], [64, 44, 18, 14, 10], [20, 46.5, 5, 9, 999]],
  [[12, 5, 76, 90, 22], [17, 10, 66, 38, 14], [17, 53, 48, 8, 4], [17, 66, 40, 3, 2], [17, 76, 30, 11, 999], [70, 75, 11, 15, 999]],
  [[2, 2, 96, 96, 16], [6, 18, 88, 46, 12], [10, 26, 44, 8, 4], [6, 7, 88, 5, 999], [10, 48, 20, 8, 999], [72, 28, 13, 17, 999]],
];

/** CSS properties for a piece state (also used for the server-rendered inline style). */
export function pieceStyle([left, top, width, height, radius, opacity = 1]: PieceState) {
  return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, borderRadius: `${radius}px`, opacity };
}

/**
 * Opacity of the layers inside the pieces at a step: token labels, atom faces
 * and their labels, molecule fills, the Aa glyph and the button label.
 */
export function layerOpacity(index: number) {
  return {
    tags: index === 0 ? 1 : 0,
    atoms: index === 1 ? 1 : 0,
    fills: index >= 2 ? 1 : 0,
    glyph: index === 0 ? 1 : 0,
    label: index >= 1 ? 1 : 0,
  };
}

/** Scroll position at which step `index` of `count` sits inside a pin from `start` to `end`. */
export function stepScrollTop(start: number, end: number, index: number, count: number): number {
  return start + ((end - start) * index) / (count - 1);
}

/** How long a click keeps its step active while the smooth scroll travels past the others. */
const CLICK_LOCK_MS = 1600;

/**
 * Pinned "token to page" build: scrubbed timeline through the five states with
 * label snapping, steps as buttons that jump to their state. Without motion the
 * frame keeps its server-rendered page state and steps set states directly.
 */
export function initTokenBuild(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>('.stage');
  const pieces = [...root.querySelectorAll<HTMLElement>('.stage .piece')];
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('.steps button')];
  if (!stage || pieces.length !== 6 || buttons.length !== BUILD_STATES.length) return () => {};
  const layers = {
    tags: [...root.querySelectorAll<HTMLElement>('.piece .tag')],
    atoms: [...root.querySelectorAll<HTMLElement>('.piece .atom, .piece .atom-tag')],
    fills: [...root.querySelectorAll<HTMLElement>('.piece .bar-fill')],
    glyph: [...root.querySelectorAll<HTMLElement>('.piece .aa')],
    label: [...root.querySelectorAll<HTMLElement>('.piece .label')],
  };
  const layerNames = Object.keys(layers) as Array<keyof typeof layers>;
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
    const opacity = layerOpacity(index);
    for (const name of layerNames) if (layers[name].length) gsap.set(layers[name], { opacity: opacity[name] });
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
    // Layers that change at this step: fading ones go out early, appearing ones come in late.
    const before = layerOpacity(step - 1);
    const after = layerOpacity(step);
    for (const name of layerNames) {
      if (!layers[name].length || before[name] === after[name]) continue;
      const position = after[name] > before[name] ? `s${step - 1}+=0.55` : `s${step - 1}`;
      build.to(layers[name], { opacity: after[name], duration: 0.45 }, position);
    }
    build.addLabel(`s${step}`);
  }

  let lockedStep = -1;
  let lockUntil = 0;
  const trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: '+=140%',
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
