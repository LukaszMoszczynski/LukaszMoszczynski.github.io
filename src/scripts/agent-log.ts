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
 * hold) and pause while the terminal is off-screen. Screen readers get the
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
    timeline = gsap
      .timeline({ repeat: -1, repeatDelay: HOLD_SECONDS, paused: !onScreen })
      .from(elements, { opacity: 0, x: -8, duration: 0.3, stagger: SECONDS_PER_LINE, ease: 'power2.out' })
      .to(elements, { opacity: 0, duration: 0.4 }, `+=${HOLD_SECONDS}`);
  };

  const handlers = chips.map((chip) => {
    const handler = () => show(chip.dataset.run as RunKey, true);
    chip.addEventListener('click', handler);
    return handler;
  });
  const initial = (chips.find((chip) => chip.getAttribute('aria-pressed') === 'true')?.dataset.run ?? 'qa') as RunKey;
  show(initial, false);
  const stopListening = onMotionPauseChange(() => show(current, false));

  return () => {
    chips.forEach((chip, index) => chip.removeEventListener('click', handlers[index]));
    stopListening();
    timeline?.kill();
    trigger.kill();
    gsap.set(lines.children, { clearProps: 'opacity,transform' });
  };
}
