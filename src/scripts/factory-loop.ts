import { gsap } from './lifecycle';
import { LOOP_CENTER, LOOP_RADIUS, factorySequence, nextRotation, type FactoryStage } from './factory-sequence';

export { factorySequence, type FactoryStage } from './factory-sequence';

/** Timing of one run, shared by the board and the card visual so both move the same way. */
export const SECONDS_PER_NODE = 0.32;
export const HOLD_SECONDS = 0.4;
export const TO_CENTER_SECONDS = 0.6;
export const LOOP_ORIGIN = `${LOOP_CENTER.x} ${LOOP_CENTER.y}`;

export interface LoopRunParts {
  /** Turns round the ring's centre (svgOrigin LOOP_ORIGIN). */
  arm: SVGGElement;
  ticket: SVGRectElement;
  /** The ticket's `y` when it sits in the middle of the hub (the board draws it on the top station, the card in the hub). */
  hubY: number;
}

/**
 * Appends one run of the delivery loop to `timeline`: the arm turns the ticket clockwise from
 * station to station, holds at each, and at `clean` the ticket slides down the arm into the
 * middle of the hub. `arrive(stage, at)` is called while building, once per stage, with the
 * time the ticket arrives, so the caller adds its own way of lighting the stage there.
 */
export function addLoopRun(
  timeline: gsap.core.Timeline,
  parts: LoopRunParts,
  sequence: readonly FactoryStage[],
  arrive: (stage: FactoryStage, at: number) => void,
): void {
  let rotation = 0;
  for (const stage of sequence) {
    if (stage === 'clean') {
      // Down the arm by one radius: the ring's centre, whatever the arm's rotation.
      timeline.to(parts.ticket, { y: parts.hubY, duration: TO_CENTER_SECONDS, ease: 'power2.inOut' });
    } else {
      const target = nextRotation(rotation, stage);
      const steps = (target - rotation) / 60;
      if (steps > 0) timeline.to(parts.arm, { rotation: target, duration: SECONDS_PER_NODE * steps, ease: 'power1.inOut' });
      rotation = target;
    }
    const at = timeline.duration();
    arrive(stage, at);
    if (stage !== 'clean') timeline.to({}, { duration: HOLD_SECONDS }, at);
  }
}

/**
 * Delivery loop: Run (or the Jira label) sends a ticket round the ring of
 * six stations for one or two random review cycles, ending in the middle of the hub, with
 * "review clean · ready for a human". Each stage is announced through a polite
 * live region. Both buttons are aria-disabled while a run is going, so focus
 * stays where it was. Not started with reduced motion: the static diagram the
 * server renders already lists every stage.
 */
export function initFactoryLoop(root: HTMLElement): () => void {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('.factory-run, .factory-jira')];
  const status = root.querySelector<HTMLElement>('.factory-status');
  const arm = root.querySelector<SVGGElement>('.factory-arm');
  const ticket = root.querySelector<SVGRectElement>('.factory-ticket');
  const marked = [...root.querySelectorAll<Element>('[data-stage]')];
  if (!buttons.length || !status || !arm || !ticket) return () => {};

  const messages = JSON.parse(root.dataset.messages ?? '{}') as Record<FactoryStage, string>;
  const idle = status.textContent ?? '';
  let timeline: gsap.core.Timeline | undefined;
  let running = false;

  root.classList.add('is-live');
  gsap.set(arm, { svgOrigin: LOOP_ORIGIN, rotation: 0 });

  const mark = (stage: FactoryStage | null) => {
    marked.forEach((element) => element.classList.toggle('is-active', (element as HTMLElement | SVGElement).dataset.stage === stage));
  };
  const setRunning = (value: boolean) => {
    running = value;
    buttons.forEach((button) => button.setAttribute('aria-disabled', String(value)));
  };
  const announce = (stage: FactoryStage) => {
    mark(stage);
    status.textContent = messages[stage] ?? stage;
    root.classList.toggle('is-clean', stage === 'clean');
  };

  const start = () => {
    if (running) return;
    timeline?.kill();
    setRunning(true);
    root.classList.remove('is-clean');
    gsap.set(arm, { rotation: 0 });
    gsap.set(ticket, { y: 0 });

    timeline = gsap.timeline({ onComplete: () => setRunning(false) });
    const run = timeline;
    addLoopRun(run, { arm, ticket, hubY: LOOP_RADIUS }, factorySequence(gsap.utils.random(1, 2, 1)), (stage, at) => {
      run.call(announce, [stage], at);
    });
  };

  const onClick = (event: Event) => {
    event.preventDefault();
    start();
  };
  buttons.forEach((button) => {
    button.setAttribute('aria-disabled', 'false');
    button.addEventListener('click', onClick);
  });

  return () => {
    timeline?.kill();
    timeline = undefined;
    buttons.forEach((button) => {
      button.removeEventListener('click', onClick);
      button.removeAttribute('aria-disabled');
    });
    mark(null);
    status.textContent = idle;
    root.classList.remove('is-live', 'is-clean');
    gsap.set([arm, ticket], { clearProps: 'all' });
  };
}
