import { gsap } from './lifecycle';
import { factorySequence, nextRotation, type FactoryStage } from './factory-sequence';

export { factorySequence, type FactoryStage } from './factory-sequence';

const SECONDS_PER_NODE = 0.32;
const HOLD_SECONDS = 0.4;
const TO_CENTER_SECONDS = 0.6;

/**
 * Dark-factory loop: Run (or the Jira label) sends a ticket round the ring of
 * six stations for one or two random review cycles, ending in the centre with
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
  const radius = Number(root.dataset.radius ?? 130);
  const idle = status.textContent ?? '';
  let timeline: gsap.core.Timeline | undefined;
  let running = false;

  root.classList.add('is-live');
  gsap.set(arm, { svgOrigin: root.dataset.origin ?? '280 225', rotation: 0 });

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
    gsap.set(ticket, { y: 0, scale: 1 });

    const sequence = factorySequence(gsap.utils.random(1, 2, 1));
    let rotation = 0;
    timeline = gsap.timeline({ onComplete: () => setRunning(false) });
    for (const stage of sequence) {
      if (stage === 'clean') {
        timeline.to(ticket, { y: radius, scale: 1.25, duration: TO_CENTER_SECONDS, ease: 'power2.inOut' });
      } else {
        const target = nextRotation(rotation, stage);
        const steps = (target - rotation) / 60;
        if (steps > 0) timeline.to(arm, { rotation: target, duration: SECONDS_PER_NODE * steps, ease: 'power1.inOut' });
        rotation = target;
      }
      timeline.call(announce, [stage]);
      if (stage !== 'clean') timeline.to({}, { duration: HOLD_SECONDS });
    }
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
