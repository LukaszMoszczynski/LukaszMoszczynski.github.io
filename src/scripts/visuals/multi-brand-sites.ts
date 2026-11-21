import { markDone, parts, storyTimeline } from './story';

/**
 * home.pl platform: the CMS sections fly from their column into the page slots, the same page
 * re-skins through the other brand accents in turn and back, then the basket and configurator
 * screens fan out from behind the page.
 */
export function homePlatformStory(screen: HTMLElement): gsap.core.Timeline {
  const sections = parts(screen, '.hp-section');
  const slots = parts(screen, '.hp-slot');
  const minis = parts(screen, '.hp-mini');
  /** Brands after the one at rest, each a group of tints (header bar and button). */
  const brands = [1, 2, 3].map((brand) => parts(screen, `.hp-tint[data-brand="${brand}"]`));
  const allTints = brands.flat();
  const timeline = storyTimeline();

  timeline
    .set(allTints, { opacity: 0 }, 0)
    .set(minis, { xPercent: -150, scale: 0.5, rotation: 0, opacity: 0 }, 0);

  slots.forEach((slot, index) => {
    const [fromX, fromY, scaleX, scaleY] = (slot.dataset.from ?? '0 0 1 1').split(' ').map(Number);
    const at = 0.3 + index * 0.35;
    timeline
      .set(slot, { transformOrigin: '0 0', xPercent: fromX, yPercent: fromY, scaleX, scaleY, opacity: 0 }, 0)
      .to(sections[index], { scale: 1.08, duration: 0.15, ease: 'power2.out' }, at)
      .to(sections[index], { scale: 1, duration: 0.3, ease: 'power2.inOut' }, at + 0.15)
      .to(slot, { opacity: 1, duration: 0.15, ease: 'none' }, at)
      .to(slot, { xPercent: 0, yPercent: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: 'power2.inOut' }, at + 0.05);
  });

  brands.forEach((tints, index) => {
    timeline.to(tints, { opacity: 1, duration: 0.35, ease: 'power1.inOut' }, 2.1 + index * 0.65);
  });
  timeline.to(allTints, { opacity: 0, duration: 0.35, ease: 'power1.inOut' }, 4.15);

  minis.forEach((mini, index) => {
    timeline.to(mini, { xPercent: 0, scale: 1, rotation: Number(mini.dataset.turn ?? 0), opacity: 1, duration: 0.55, ease: 'back.out(1.6)' }, 4.5 + index * 0.15);
  });
  markDone(timeline);
  timeline.to([...slots, ...minis], { opacity: 0, duration: 0.45, ease: 'power1.in' });
  return timeline;
}
