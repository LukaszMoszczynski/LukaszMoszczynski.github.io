import { gsap, quietArrival, ScrollTrigger } from './lifecycle';
import { motionPaused, onMotionPauseChange } from './motion-pause';

/** Splits `text` into words; joined by a single space they give back the original. */
export function splitWords(text: string): string[] {
  return text.split(' ').filter((word) => word.length > 0);
}

/** A statement whose top is above this share of the viewport height counts as visible at load (a peeking first line counts). */
const STATEMENT_IN_VIEW = 0.98;
/** The colour scrub runs from the section top at 60% of the viewport to its bottom at 30%. */
export const HEAT_START = 'top 60%';
export const HEAT_END = 'bottom 30%';

/**
 * The entrance: every word starts muted and lights up to full ink, one after another. It is a short,
 * time-based reveal that always ends fully readable (WCAG 1.4.3 applies to the text at rest), so the
 * muted start may be well below 3:1. Nothing about it is tied to scroll: once started it runs to the end.
 */
export const ENTRANCE_OPACITY = 0.18;
export const ENTRANCE_DELAY = 0.2;
export const ENTRANCE_WORD_SECONDS = 0.45;
export const ENTRANCE_STAGGER_SECONDS = 0.9;
export const ENTRANCE_SECONDS = ENTRANCE_DELAY + ENTRANCE_STAGGER_SECONDS + ENTRANCE_WORD_SECONDS;
/** Safety net: whatever happens to the tween (throttled background tab, killed ticker), words are at full ink by then. */
const FALLBACK_MS = (ENTRANCE_SECONDS + 0.6) * 1000;
/** Below the fold the words dim while the statement is still just off screen, and light up once its top is this far in. */
const DIM_START = 'top bottom';
const PLAY_START = 'top 85%';
/** Dimmed off screen but the reader stopped short of PLAY_START: the entrance plays anyway after this. */
const PLAY_ANYWAY_MS = 2500;

/**
 * Word-by-word light-up of the statement, then a word-by-word turn to orange as the reader
 * scrolls past it. Server render is plain text; with motion the words are wrapped in `.word`
 * spans. On screen at load the entrance plays right away; further down it plays as the
 * statement comes into view. While it runs, `data-entrance="running"` is on the section.
 * Pause animations (and reduced motion, which never calls this) show the final text at once.
 * Cleanup restores the original text.
 */
export function initStatement(root: HTMLElement): () => void {
  const paragraph = root.querySelector<HTMLElement>('p');
  if (!paragraph) return () => {};
  const original = paragraph.textContent ?? '';
  paragraph.replaceChildren();
  splitWords(original).forEach((word, index) => {
    if (index > 0) paragraph.append(' ');
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = word;
    paragraph.append(span);
  });

  const words = [...paragraph.querySelectorAll<HTMLElement>('.word')];
  const timers: number[] = [];
  const triggers: ScrollTrigger[] = [];
  let entrance: gsap.core.Tween | undefined;
  let state: 'waiting' | 'dimmed' | 'running' | 'done' = 'waiting';

  const finish = () => {
    if (state === 'done') return;
    state = 'done';
    entrance?.kill();
    entrance = undefined;
    gsap.set(words, { opacity: 1 });
    delete root.dataset.entrance;
    triggers.forEach((trigger) => trigger.kill());
    timers.forEach((timer) => clearTimeout(timer));
  };
  const dim = () => {
    if (state !== 'waiting') return;
    state = 'dimmed';
    root.dataset.entrance = 'running';
    gsap.set(words, { opacity: ENTRANCE_OPACITY });
    timers.push(window.setTimeout(play, PLAY_ANYWAY_MS));
  };
  const play = (delay = ENTRANCE_DELAY) => {
    if (state === 'waiting') dim();
    if (state !== 'dimmed') return;
    state = 'running';
    entrance = gsap.to(words, {
      opacity: 1, duration: ENTRANCE_WORD_SECONDS, ease: 'power1.out', delay,
      stagger: { amount: ENTRANCE_STAGGER_SECONDS }, onComplete: finish,
    });
    timers.push(window.setTimeout(finish, FALLBACK_MS + delay * 1000));
  };

  const start = (quiet: boolean) => {
    if (state !== 'waiting') return;
    const box = paragraph.getBoundingClientRect();
    const onScreen = box.top < innerHeight * STATEMENT_IN_VIEW;
    if (motionPaused() || (quiet && onScreen) || box.bottom <= 0) {
      // Paused, back from a language switch with it in sight, or already read above: final text, no entrance.
      state = 'done';
    } else if (onScreen) {
      // On screen at load (short hero, restored scroll): it lights up once, without waiting for a scroll.
      play();
    } else {
      // Further down: still full ink until it is just below the screen edge, so it is never dim where nobody looks for long.
      triggers.push(
        ScrollTrigger.create({ trigger: paragraph, start: DIM_START, once: true, onEnter: dim }),
        ScrollTrigger.create({ trigger: paragraph, start: PLAY_START, once: true, onEnter: () => play(0) }),
      );
    }
  };
  if (quietArrival()) {
    // After a language switch the page is still at the top here; lifecycle.ts puts the reader back at
    // their place once every setup ran. Measure after that, in the microtask that follows the setups.
    queueMicrotask(() => start(true));
  } else {
    start(false);
  }
  const stopListening = onMotionPauseChange((paused) => {
    if (paused) finish();
  });

  // Reading on past it, the words turn from ink to the text accent one by one (--heat 0 → 1, CSS mixes
  // the colour, so a theme switch needs nothing here). Scrubbed both ways; a page loaded below it starts orange.
  gsap.fromTo(
    words,
    { '--heat': 0 },
    { '--heat': 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: root, start: HEAT_START, end: HEAT_END, scrub: true } },
  );

  return () => {
    stopListening();
    finish();
    paragraph.textContent = original;
  };
}
