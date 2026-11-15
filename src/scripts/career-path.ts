import { gsap, ScrollTrigger } from './lifecycle';

/**
 * Career path: the line draws itself with a glowing dot while scrolling and
 * each entry gets `lit` once it passes 62% of the viewport. Cleanup removes the
 * decorative elements and the `js` class.
 */
export function initCareerPath(root: HTMLElement): () => void {
  const list = root.querySelector<HTMLElement>('.tl');
  if (!list) return () => {};
  list.classList.add('js');
  const progress = document.createElement('span');
  progress.className = 'tl-progress';
  progress.setAttribute('aria-hidden', 'true');
  const dot = document.createElement('span');
  dot.className = 'tl-dot';
  dot.setAttribute('aria-hidden', 'true');
  list.prepend(progress, dot);

  const range = { trigger: list, start: 'top 70%', end: 'bottom 55%', scrub: 0.5 };
  gsap.fromTo(progress, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: range });
  gsap.fromTo(
    dot,
    { y: 0 },
    { y: () => list.offsetHeight - 12, ease: 'none', scrollTrigger: { ...range, invalidateOnRefresh: true } },
  );
  list.querySelectorAll<HTMLElement>('li').forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'clamp(top 62%)',
      onEnter: () => item.classList.add('lit'),
      onLeaveBack: () => item.classList.remove('lit'),
    });
  });

  return () => {
    list.classList.remove('js');
    progress.remove();
    dot.remove();
    list.querySelectorAll('li').forEach((item) => item.classList.remove('lit'));
  };
}
