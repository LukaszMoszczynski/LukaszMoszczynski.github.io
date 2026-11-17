import { gsap } from '../lifecycle';
import { LOOP_RADIUS, factorySequence } from '../factory-sequence';
import { addLoopRun, LOOP_ORIGIN } from '../factory-loop';
import { markDone, part, parts, storyTimeline } from './story';

const LIGHT_SECONDS = 0.3;

/**
 * Delivery loop: the board from the case page (LoopDiagram.astro), playing by itself. The ticket
 * makes the board's run with one review cycle (label → agents → push → review → comments → fix →
 * push → review → the human), with the board's timing (addLoopRun): each station lights up while
 * the ticket is on it, as the board's active station does, and the run ends with the ticket in the
 * middle of the lit hub — the finished frame the server draws.
 */
export function deliveryLoopStory(screen: HTMLElement): gsap.core.Timeline {
  const arm = part<SVGGElement>(screen, '.factory-arm');
  const ticket = part<SVGRectElement>(screen, '.factory-ticket');
  const lights = parts<SVGCircleElement>(screen, '.loop-lit');
  const timeline = storyTimeline();
  gsap.set(arm, { svgOrigin: LOOP_ORIGIN });

  // Opening frame: the board at idle, the ticket on the top station (it is drawn in the hub).
  timeline
    .set(arm, { rotation: 0 }, 0)
    .set(ticket, { y: -LOOP_RADIUS }, 0)
    .set(lights, { opacity: 0 }, 0)
    .fromTo(ticket, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0);

  const run = gsap.timeline();
  let lit: SVGCircleElement | undefined;
  addLoopRun(run, { arm, ticket, hubY: 0 }, factorySequence(1), (stage, at) => {
    const light = lights.find((element) => element.dataset.lit === stage);
    if (lit && lit !== light) run.to(lit, { opacity: 0, duration: LIGHT_SECONDS, ease: 'none' }, at);
    if (light && light !== lit) run.to(light, { opacity: 1, duration: LIGHT_SECONDS, ease: 'none' }, at);
    lit = light;
  });
  timeline.add(run, 0.3);
  markDone(timeline);
  // Outro: the ticket and the hub fade, back to the opening frame.
  timeline.to([ticket, ...lights], { opacity: 0, duration: 0.5, ease: 'power1.in' });
  return timeline;
}
