import { gsap } from '../lifecycle';
import { arcShare, FACTORY_NODES, ringStops } from '../factory-sequence';
import { markDone, part, parts, storyTimeline } from './story';

/** Ring centre and radius in the visual's viewBox (ProjectVisual.astro). */
const ORIGIN = '200 150';
const RADIUS = 100;
const SECONDS_PER_NODE = 0.3;
const NODE_HOLD = 0.12;

/**
 * Delivery loop: the ticket travels the ring node to node along the same run as the
 * interactive board (one review cycle: label → agents → push → review → comments → fix →
 * push → review), the arc behind it fills orange, each station lights up as the ticket
 * arrives, and the run ends in the hub, where the human lights up.
 */
export function deliveryLoopStory(screen: HTMLElement): gsap.core.Timeline {
  const arm = part<SVGGElement>(screen, '.loop-arm');
  const ticket = part<SVGRectElement>(screen, '.ticket-chip');
  const arc = part<SVGCircleElement>(screen, '.ring-run');
  const lights = parts<SVGCircleElement>(screen, '.node-lit');
  const hub = part<SVGCircleElement>(screen, '.hub-lit');
  const timeline = storyTimeline();
  gsap.set(arm, { svgOrigin: ORIGIN });

  timeline
    .set(arm, { rotation: 0 }, 0)
    .set(ticket, { y: -RADIUS, scale: 1, transformOrigin: '50% 50%' }, 0)
    .set(arc, { strokeDashoffset: 100, opacity: 1 }, 0)
    .set([...lights, hub], { opacity: 0, scale: 1, transformOrigin: '50% 50%' }, 0)
    .fromTo(ticket, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.1);

  let rotation = 0;
  let at = 0.4;
  for (const stop of ringStops(1)) {
    const steps = (stop.rotation - rotation) / 60;
    if (steps > 0) {
      const duration = SECONDS_PER_NODE * steps;
      timeline.to(arm, { rotation: stop.rotation, duration, ease: 'power1.inOut' }, at);
      if (arcShare(rotation) < 1) timeline.to(arc, { strokeDashoffset: 100 - arcShare(stop.rotation) * 100, duration, ease: 'power1.inOut' }, at);
      at += duration;
    }
    rotation = stop.rotation;
    const light = lights[FACTORY_NODES.indexOf(stop.stage as (typeof FACTORY_NODES)[number])];
    timeline.fromTo(light, { opacity: 1, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.35, immediateRender: false }, at);
    at += NODE_HOLD;
  }
  timeline
    .to(ticket, { y: 0, scale: 1.15, duration: 0.5, ease: 'power2.inOut' }, at + 0.1)
    .fromTo(hub, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, at + 0.45)
    .to(ticket, { scale: 1, duration: 0.3 }, at + 0.6);
  markDone(timeline);
  timeline.to([ticket, arc, ...lights, hub], { opacity: 0, duration: 0.5, ease: 'power1.in' });
  return timeline;
}
