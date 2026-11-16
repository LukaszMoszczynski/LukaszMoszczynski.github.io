import { markDone, part, parts, storyTimeline } from './story';

/**
 * The Figma frame and the WordPress page are the same size, 51% of the screen width apart;
 * a block is 84% of that width wide, so it travels 51 / (0.35 × 0.84 × 100) of its own width.
 */
const ACROSS = -173.5;

/**
 * WP Starter: the Figma blocks copy across the arrow one by one into the WordPress page.
 * Each travels in its Figma look (light fill, dashed outline) and takes its final colour as
 * it lands.
 */
export function wpStarterStory(screen: HTMLElement): gsap.core.Timeline {
  const sources = parts(screen, '.wp-source');
  const blocks = parts(screen, '.wp-block');
  const skins = parts(screen, '.wp-skin');
  const arrow = part<SVGSVGElement>(screen, '.arrow');
  const timeline = storyTimeline();

  timeline
    .set(blocks, { xPercent: ACROSS, opacity: 0 }, 0)
    .set(skins, { opacity: 1 }, 0)
    .set(sources, { scale: 1 }, 0)
    .set(arrow, { opacity: 1 }, 0);

  blocks.forEach((block, index) => {
    const at = 0.3 + index * 1.0;
    timeline
      .to(sources[index], { scale: 1.06, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.inOut' }, at)
      .to(block, { opacity: 1, duration: 0.15 }, at + 0.1)
      .to(block, { xPercent: 0, duration: 0.8, ease: 'power2.inOut' }, at + 0.1)
      .fromTo(arrow, { opacity: 0.4 }, { opacity: 1, duration: 0.5, immediateRender: false }, at + 0.25)
      .to(skins[index], { opacity: 0, duration: 0.35 }, at + 0.8);
  });
  markDone(timeline);
  timeline.to(blocks, { opacity: 0, duration: 0.45, ease: 'power1.in' });
  return timeline;
}
