import { markDone, part, parts, storyTimeline } from './story';

/**
 * Omelański: a packet runs from each domain pill (www, .com, the old address) along its
 * dashed path into the site, the old path shows a small "301" tag, and the site's blocks
 * build in.
 */
export function omelanskiStory(screen: HTMLElement): gsap.core.Timeline {
  const packets = parts<SVGPathElement>(screen, '.om-packet');
  const domains = parts(screen, '.domain');
  const tag = part(screen, '.om-301');
  const blocks = parts(screen, '.om-block');
  const timeline = storyTimeline();

  timeline
    .set(packets, { strokeDashoffset: 4, opacity: 0 }, 0)
    .set(domains, { scale: 1 }, 0)
    .set(tag, { scale: 0 }, 0)
    .set(blocks, { scaleX: 0, opacity: 1, transformOrigin: '0% 50%' }, 0);

  packets.forEach((packet, index) => {
    const at = 0.2 + index * 0.35;
    timeline
      .to(domains[index], { scale: 1.08, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.inOut' }, at)
      .set(packet, { opacity: 1 }, at + 0.1)
      .to(packet, { strokeDashoffset: -100, duration: 1.0, ease: 'power1.inOut' }, at + 0.1)
      .set(packet, { opacity: 0 }, at + 1.1);
  });
  timeline
    .to(tag, { scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, 1.35)
    .to(blocks, { scaleX: 1, duration: 0.4, stagger: 0.15 }, 1.6);
  markDone(timeline);
  timeline
    .to(blocks, { opacity: 0, duration: 0.45, ease: 'power1.in' })
    .to(tag, { scale: 0, duration: 0.3, ease: 'power2.in' }, '<');
  return timeline;
}
