import { CELL, cellOrigin, gridLines, nearestCrossing, tracerShape, type GridLines, type Point, type TracerShape } from './grid';
import { gsap, hasFinePointer, prefersReducedMotion } from './lifecycle';
import { motionPaused, onMotionPauseChange } from './motion-pause';

type Direction = 'up' | 'down' | 'left' | 'right';
type Origin = 'ambient' | 'burst';

/** Pointer over these hides the hover cell; clicks on them never burst. */
const CONTENT = 'a, button, [role=button], .stage, .project-card, .skill, .quote, header';
/** Clicks inside text are for selecting it, not for bursts. */
const TEXT = 'h1, h2, h3, p, li, blockquote, figure';

const SPEED = 160; // px per second at duration factor 1
const MAX_AMBIENT = 3;
const BURST_CELLS = 3;
const RESIZE_DEBOUNCE = 150;

const GRADIENT: Record<Direction, string> = { down: 'to bottom', up: 'to top', right: 'to right', left: 'to left' };
const HIDDEN_CLIP: Record<Direction, string> = {
  down: 'inset(0% 0% 100% 0%)',
  up: 'inset(100% 0% 0% 0%)',
  right: 'inset(0% 100% 0% 0%)',
  left: 'inset(0% 0% 0% 100%)',
};

let teardown: (() => void) | null = null;

function span(className: string): HTMLSpanElement {
  const element = document.createElement('span');
  element.className = className;
  return element;
}

function pick<T>(values: T[], fallback: T[]): T {
  const source = values.length ? values : fallback;
  return source[Math.floor(Math.random() * source.length)];
}

/**
 * Starts the global background: blueprint grid with draw-in, ambient tracers,
 * hover cell, click burst and cursor light. The markup is `transition:persist`,
 * so this runs once per full page load and survives client-side navigation.
 * Calling it again returns the existing teardown.
 */
export function initBackground(): () => void {
  if (teardown) return teardown;

  const gridLayer = document.querySelector<HTMLElement>('.grid-layer');
  const glowA = document.querySelector<HTMLElement>('.light-layer .glow-a');
  const glowB = document.querySelector<HTMLElement>('.light-layer .glow-b');
  if (!gridLayer || !glowA || !glowB) return () => {};

  const reduced = prefersReducedMotion();
  const animations = new Set<gsap.core.Animation>();
  const listeners: Array<() => void> = [];
  let lines: GridLines = { columns: [], rows: [], offsetX: 0 };
  let lineElements: HTMLElement[] = [];
  let stopped = false;
  const ambientTracers = new Set<gsap.core.Timeline>();

  /** Remembers an animation until it completes, keeping its own onComplete. */
  const track = <T extends gsap.core.Animation>(animation: T): T => {
    const own = animation.eventCallback('onComplete');
    animations.add(animation);
    animation.eventCallback('onComplete', () => {
      animations.delete(animation);
      own?.();
    });
    return animation;
  };
  type EventMap = WindowEventMap & DocumentEventMap;
  const listen = <K extends keyof EventMap>(
    target: EventTarget, type: K, handler: (event: EventMap[K]) => void,
  ) => {
    const listener = handler as EventListener;
    target.addEventListener(type, listener, { passive: true });
    listeners.push(() => target.removeEventListener(type, listener));
  };

  const buildGrid = () => {
    lineElements.forEach((element) => element.remove());
    lines = gridLines(innerWidth, innerHeight);
    const fragment = document.createDocumentFragment();
    const verticals = lines.columns.map((x) => {
      const element = span('v');
      element.style.left = `${x}px`;
      return element;
    });
    const horizontals = lines.rows.map((y) => {
      const element = span('h');
      element.style.top = `${y}px`;
      return element;
    });
    lineElements = [...verticals, ...horizontals];
    fragment.append(...lineElements);
    gridLayer.prepend(fragment);
    return { verticals, horizontals };
  };

  const { verticals, horizontals } = buildGrid();

  let resizeTimer: number | undefined;
  listen(window, 'resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildGrid, RESIZE_DEBOUNCE);
  });

  if (reduced) {
    teardown = () => {
      clearTimeout(resizeTimer);
      listeners.forEach((remove) => remove());
      lineElements.forEach((element) => element.remove());
      teardown = null;
    };
    return teardown;
  }

  /** Burst tracers move together on purpose: same speed, ease and fade. */
  const BURST_MOTION: Omit<TracerShape, 'cells'> = { durationFactor: 1, ease: 'power1.inOut', delay: 0, linger: 0.2 };

  // a glowing point draws a stretch of grid line, then both fade; each ambient point has its own speed, ease, delay and linger
  const trace = (origin: Point, direction: Direction, length: number, kind: Origin, onDone?: () => void, motion: Omit<TracerShape, 'cells'> = BURST_MOTION) => {
    const vertical = direction === 'up' || direction === 'down';
    const line = span(vertical ? 'tv' : 'th');
    const dot = span('dot');
    line.dataset.origin = kind;
    line.style.background = `linear-gradient(${GRADIENT[direction]}, transparent, var(--accent))`;
    if (vertical) {
      line.style.left = `${origin.x}px`;
      line.style.top = `${direction === 'down' ? origin.y : origin.y - length}px`;
      line.style.height = `${length}px`;
    } else {
      line.style.top = `${origin.y}px`;
      line.style.left = `${direction === 'right' ? origin.x : origin.x - length}px`;
      line.style.width = `${length}px`;
    }
    dot.style.left = `${origin.x}px`;
    dot.style.top = `${origin.y}px`;
    gridLayer.append(line, dot);

    const move = { down: { y: length }, up: { y: -length }, right: { x: length }, left: { x: -length } }[direction];
    const duration = (length / SPEED) * motion.durationFactor;
    const timeline = gsap.timeline({
      delay: motion.delay,
      onComplete: () => {
        ambientTracers.delete(timeline);
        line.remove();
        dot.remove();
        onDone?.();
      },
    });
    timeline
      .fromTo(line, { clipPath: HIDDEN_CLIP[direction] }, { clipPath: 'inset(0% 0% 0% 0%)', duration, ease: motion.ease, immediateRender: true })
      .fromTo(dot, { x: 0, y: 0, scale: 0 }, { ...move, scale: 1, duration, ease: motion.ease, immediateRender: true }, 0)
      .to([line, dot], { opacity: 0, duration: 0.8 }, `+=${motion.linger}`);
    track(timeline);
    if (kind === 'ambient') ambientTracers.add(timeline);
  };

  // ambient tracers: at most three at a time, forever, each with its own length and speed; paused while the tab is hidden
  let ambient = 0;
  let waiting = 0;
  const schedule = (delay: number) => {
    track(gsap.delayedCall(delay, spawnAmbient));
  };
  function spawnAmbient() {
    if (stopped) return;
    if (document.hidden || motionPaused()) {
      waiting++;
      return;
    }
    if (ambient >= MAX_AMBIENT) return;
    if (!lines.columns.length || !lines.rows.length) {
      schedule(1);
      return;
    }
    ambient++;
    const vertical = Math.random() < 0.5;
    const { cells, ...motion } = tracerShape();
    // Start far enough from the bottom / right edge that most of the line stays on screen.
    const origin = vertical
      ? { x: pick(lines.columns, []), y: pick([0, ...lines.rows.slice(0, -cells)], [0]) }
      : { x: pick(lines.columns.slice(0, -cells), lines.columns.slice(0, 1)), y: pick(lines.rows, []) };
    trace(origin, vertical ? 'down' : 'right', CELL * cells, 'ambient', () => {
      ambient--;
      schedule(gsap.utils.random(0.2, 1.4));
    }, motion);
  }
  const resumeWaiting = () => {
    if (document.hidden || motionPaused()) return;
    while (waiting > 0) {
      waiting--;
      schedule(gsap.utils.random(0, 1));
    }
  };
  listen(document, 'visibilitychange', resumeWaiting);

  // click burst: four tracers from the nearest crossing and a ring pulse
  listen(document, 'click', (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest(`${CONTENT}, ${TEXT}`)) return;
    if (!lines.columns.length) return;
    const crossing = nearestCrossing(event.clientX, event.clientY, lines);
    (['up', 'down', 'left', 'right'] as const).forEach((direction) =>
      trace(crossing, direction, CELL * BURST_CELLS, 'burst'));
    const ring = span('ring');
    ring.style.left = `${crossing.x}px`;
    ring.style.top = `${crossing.y}px`;
    gridLayer.append(ring);
    track(gsap.fromTo(ring, { scale: 0.4, opacity: 1 }, {
      scale: 4, opacity: 0, duration: 0.9, ease: 'power2.out', onComplete: () => ring.remove(),
    }));
  });

  // hover cell and cursor light follow a fine pointer; on touch the light drifts
  const drift: gsap.core.Tween[] = [];
  const glowSize = () => glowA.offsetWidth / 2;
  const hoverCell = span('cell');
  if (hasFinePointer()) {
    gridLayer.append(hoverCell);
    const lightAx = gsap.quickTo(glowA, 'x', { duration: 1.6, ease: 'power3' });
    const lightAy = gsap.quickTo(glowA, 'y', { duration: 1.6, ease: 'power3' });
    const lightBx = gsap.quickTo(glowB, 'x', { duration: 2.6, ease: 'power3' });
    const lightBy = gsap.quickTo(glowB, 'y', { duration: 2.6, ease: 'power3' });
    listen(window, 'pointermove', (event: PointerEvent) => {
      const overContent = event.target instanceof Element && event.target.closest(CONTENT);
      hoverCell.style.opacity = overContent ? '0' : '1';
      const corner = cellOrigin(event.clientX, event.clientY, lines);
      gsap.set(hoverCell, { x: corner.x, y: corner.y });
      const size = glowSize();
      lightAx(event.clientX - size);
      lightAy(event.clientY - size);
      lightBx(innerWidth - event.clientX - size);
      lightBy(innerHeight - event.clientY - size * 0.6);
    });
    listen(document.documentElement, 'pointerleave', () => { hoverCell.style.opacity = '0'; });
  } else {
    drift.push(
      track(gsap.to(glowA, { x: `+=${innerWidth * 0.2}`, y: `+=${glowSize() * 0.45}`, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: motionPaused() })),
      track(gsap.to(glowB, { x: `+=${innerWidth * 0.3}`, y: `-=${glowSize() * 0.26}`, duration: 11, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: motionPaused() })),
    );
  }

  // "Pause animations": running ambient tracers jump to their end (and are not replaced), the drift stops.
  // Click bursts and the pointer light answer the reader, so they keep working.
  listeners.push(onMotionPauseChange((paused) => {
    drift.forEach((tween) => (paused ? tween.pause() : tween.resume()));
    if (paused) ambientTracers.forEach((timeline) => timeline.progress(1));
    else resumeWaiting();
  }));

  // first load only: lines draw in (≤ 1.2 s), glows bloom, then tracers start
  const intro = gsap.timeline();
  intro
    .from(verticals, { scaleY: 0, duration: 0.8, ease: 'power3.inOut', stagger: { amount: 0.3, from: 'center' } })
    .from(horizontals, { scaleX: 0, duration: 0.8, ease: 'power3.inOut', stagger: { amount: 0.3, from: 'start' } }, 0.1)
    .from([glowA, glowB], { opacity: 0, scale: 0.6, duration: 1.2, ease: 'power2.out' }, 0)
    .add(() => {
      // Staggered at random, so the first three never start in step.
      spawnAmbient();
      schedule(gsap.utils.random(0.4, 1.1));
      schedule(gsap.utils.random(1.2, 2.2));
    }, 1.2);
  track(intro);

  teardown = () => {
    stopped = true;
    clearTimeout(resizeTimer);
    listeners.forEach((remove) => remove());
    animations.forEach((animation) => animation.kill());
    animations.clear();
    gridLayer.replaceChildren();
    gsap.set([glowA, glowB], { clearProps: 'all' });
    teardown = null;
  };
  return teardown;
}
