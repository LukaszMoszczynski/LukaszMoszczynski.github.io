import { markDone, part, parts, storyTimeline } from './story';

/**
 * QA agent: a scan line sweeps the master and branch screenshots, the dashed box is drawn
 * round the block that differs, the two result rows fill and get their ✓ and !, and the
 * merge request pill fills and reads "1 diff".
 */
export function qaAgentStory(screen: HTMLElement): gsap.core.Timeline {
  const scans = parts(screen, '.qa-scan');
  const box = part(screen, '.qa-box');
  const rowFills = parts(screen, '.qa-row .qa-fill');
  const dots = parts(screen, '.qa-dot');
  const mergeFill = part(screen, '.qa-mr .qa-fill');
  const mergeLabel = part(screen, '.qa-mr-label');
  const boxHidden = 'inset(0% 100% 100% 0%)';
  const timeline = storyTimeline();

  timeline
    .set(scans, { yPercent: -100, opacity: 1 }, 0)
    .set(box, { clipPath: boxHidden }, 0)
    .set([...rowFills, mergeFill], { scaleX: 0 }, 0)
    .set([...dots, mergeLabel], { scale: 0 }, 0)
    .to(scans, { yPercent: 0, duration: 1.6, ease: 'none' }, 0.2)
    .to(scans, { opacity: 0, duration: 0.3 }, 1.7)
    .to(box, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power1.inOut' }, 1.0)
    .to(rowFills, { scaleX: 1, duration: 0.5, stagger: 0.3 }, 2.0)
    .to(dots, { scale: 1, duration: 0.3, ease: 'back.out(2)', stagger: 0.3 }, 2.4)
    .to(mergeFill, { scaleX: 1, duration: 0.5 }, 3.0)
    .to(mergeLabel, { scale: 1, duration: 0.35, ease: 'back.out(2)' }, 3.4);
  markDone(timeline);
  timeline
    .to([mergeLabel, ...dots], { scale: 0, duration: 0.3, ease: 'power2.in' })
    .to([...rowFills, mergeFill], { scaleX: 0, duration: 0.4, ease: 'power2.in' }, '<0.1')
    .to(box, { clipPath: boxHidden, duration: 0.4, ease: 'power2.in' }, '<');
  return timeline;
}
