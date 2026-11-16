import { markDone, part, parts, storyTimeline } from './story';

/**
 * Design system: the tokens (colour swatches) pop in, two of them drop into the atoms
 * (pills), the atoms snap into a card, the card lands on a page, and the brand swaps once
 * (multi-brand) before swapping back.
 */
export function designSystemStory(screen: HTMLElement): gsap.core.Timeline {
  const brand = part(screen, '.ds-brand');
  const swatches = parts(screen, '.swatch');
  const drops = parts(screen, '.ds-drop');
  const pills = parts(screen, '.ds-atom-pill');
  const page = part(screen, '.ds-page');
  const card = part(screen, '.ds-card');
  const atoms = parts(screen, '.ds-card .ds-atom');
  const pageHidden = 'inset(0% 100% 0% 0%)';
  const timeline = storyTimeline();

  timeline
    .set(brand, { opacity: 0 }, 0)
    .set(swatches, { scale: 0, opacity: 1 }, 0)
    .set(pills, { scale: 0.5, opacity: 0 }, 0)
    .set(page, { clipPath: pageHidden, opacity: 1 }, 0)
    .set(card, { yPercent: -35, opacity: 0 }, 0)
    .set(atoms, { scale: 0 }, 0)
    .to(swatches, { scale: 1, duration: 0.4, ease: 'back.out(2)', stagger: 0.12 }, 0.2);

  drops.forEach((drop, index) => {
    const [fromX, fromY] = (drop.dataset.from ?? '0 0').split(' ').map(Number);
    const at = 1.0 + index * 0.2;
    timeline
      .fromTo(drop, { opacity: 1, xPercent: fromX, yPercent: fromY }, { xPercent: 0, yPercent: 0, duration: 0.5, ease: 'power2.in' }, at)
      .to(drop, { opacity: 0, duration: 0.15 }, at + 0.5)
      .to(pills[index], { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' }, at + 0.45);
  });

  timeline
    .to(page, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power1.inOut' }, 2.0)
    .to(card, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.4)' }, 2.2)
    .to(atoms, { scale: 1, duration: 0.35, ease: 'back.out(3)', stagger: 0.12 }, 2.7)
    .to(brand, { opacity: 1, duration: 0.5, ease: 'power1.inOut' }, 3.4)
    .to(brand, { opacity: 0, duration: 0.5, ease: 'power1.inOut' }, 4.4);
  markDone(timeline);
  timeline.to([...swatches, ...pills, page, card], { opacity: 0, duration: 0.5, ease: 'power1.in' });
  return timeline;
}
