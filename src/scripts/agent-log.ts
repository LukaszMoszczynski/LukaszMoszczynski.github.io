import { gsap, ScrollTrigger, prefersReducedMotion } from './lifecycle';
import { AGENT_RUNS, type RunKey } from './agent-runs';
import { motionPaused, onMotionPauseChange } from './motion-pause';

export { AGENT_RUNS, type LogLine } from './agent-runs';

const SECONDS_PER_LINE = 0.45;
const HOLD_SECONDS = 2.5;

/** One animated `<div>` per line; markup matches what Stack renders on the server. */
export function renderLines(container: HTMLElement, key: RunKey): HTMLElement[] {
  container.replaceChildren(
    ...AGENT_RUNS[key].map((line) => {
      const element = document.createElement('div');
      element.className = line.kind;
      if (line.kind === 'step') {
        const prompt = document.createElement('span');
        prompt.className = 'prompt';
        prompt.textContent = '›';
        element.append(prompt, ` ${line.text}`);
      } else {
        element.textContent = line.text;
      }
      return element;
    }),
  );
  return [...container.children] as HTMLElement[];
}

/**
 * Agent log: chips pick a run, lines replay in a loop (0.45 s per line, 2.5 s
 * hold) and pause while the terminal is off-screen. The run's first line (its
 * comment) never fades, so the log is never an empty box: not before the first
 * line appears, not between runs and not after a chip switch. Screen readers get the
 * whole run once per chip change through a visually hidden live region; the
 * animated lines are aria-hidden so the replay is never announced. With reduced motion
 * or "Pause animations" the whole run is shown at rest, without the loop.
 */
export function initAgentLog(root: HTMLElement): () => void {
  const chips = [...root.querySelectorAll<HTMLButtonElement>('.chip')];
  const lines = root.querySelector<HTMLElement>('.term-lines');
  const announcer = root.querySelector<HTMLElement>('.term-sr');
  if (!chips.length || !lines) return () => {};

  const reduced = prefersReducedMotion();
  let timeline: gsap.core.Timeline | undefined;
  let onScreen = false;
  let current: RunKey = 'qa';

  const trigger = ScrollTrigger.create({
    trigger: lines,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      onScreen = self.isActive;
      if (onScreen) timeline?.play();
      else timeline?.pause();
    },
  });

  const show = (key: RunKey, announce: boolean) => {
    timeline?.kill();
    timeline = undefined;
    current = key;
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.run === key)));
    const elements = renderLines(lines, key);
    if (announce && announcer) announcer.textContent = AGENT_RUNS[key].map((line) => line.text).join('. ');
    if (reduced || motionPaused()) return;
    const replayed = elements.slice(1);
    if (!replayed.length) return;
    // The next line follows almost at once; after the hold the rest fade and the loop starts over right away.
    timeline = gsap
      .timeline({ repeat: -1, paused: !onScreen })
      .fromTo(replayed, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, stagger: SECONDS_PER_LINE, ease: 'power2.out' }, 0.1)
      .to(replayed, { opacity: 0, duration: 0.4 }, `+=${HOLD_SECONDS}`);
  };

  const handlers = chips.map((chip) => {
    const handler = () => show(chip.dataset.run as RunKey, true);
    chip.addEventListener('click', handler);
    return handler;
  });
  // Phones wrap the lines, so runs differ in height: the box keeps the tallest one, and a tab switch never moves the page.
  let measuredWidth = 0;
  const measure = () => {
    measuredWidth = lines.clientWidth;
    lines.style.removeProperty('--term-height');
    let tallest = 0;
    for (const key of Object.keys(AGENT_RUNS) as RunKey[]) {
      renderLines(lines, key);
      tallest = Math.max(tallest, lines.offsetHeight);
    }
    lines.style.setProperty('--term-height', `${tallest}px`);
  };
  measure();
  const onResize = () => {
    if (lines.clientWidth === measuredWidth) return;
    measure();
    show(current, false);
  };
  window.addEventListener('resize', onResize);

  const initial = (chips.find((chip) => chip.getAttribute('aria-pressed') === 'true')?.dataset.run ?? 'qa') as RunKey;
  show(initial, false);
  const stopListening = onMotionPauseChange(() => show(current, false));

  return () => {
    chips.forEach((chip, index) => chip.removeEventListener('click', handlers[index]));
    stopListening();
    window.removeEventListener('resize', onResize);
    lines.style.removeProperty('--term-height');
    timeline?.kill();
    trigger.kill();
    gsap.set(lines.children, { clearProps: 'opacity,transform' });
  };
}
