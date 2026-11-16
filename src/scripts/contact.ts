import { gsap } from './lifecycle';
import { copyText } from './copy';

export { copyText } from './copy';

const FEEDBACK_MS = 2000;

/** Scroll position where the line is done: section top at 25% of the viewport, but never beyond the end of the page. */
function fillEnd(root: HTMLElement): number {
  const natural = root.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.25;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return Math.max(0, Math.min(natural, maxScroll));
}

/**
 * Contact section. `root` holds `.fill` (the big line), `.copy-btn` buttons
 * (data-copy, data-copied, data-failed) and a polite `.contact-announce`.
 * With `animate` the line scrubs from grey to orange as the section arrives;
 * otherwise (reduced motion) it stays fully orange, which is also the CSS
 * default so it is never stuck grey without JS.
 */
export function initContact(root: HTMLElement, animate = true): () => void {
  const timers = new Set<number>();
  const cleanups: Array<() => void> = [];
  const announcer = root.querySelector<HTMLElement>('.contact-announce');

  const fill = root.querySelector<HTMLElement>('.fill');
  if (fill && animate) {
    const tween = gsap.fromTo(
      fill,
      { '--p': '0%' },
      { '--p': '100%', ease: 'none', scrollTrigger: { trigger: root, start: 'top 85%', end: () => fillEnd(root), scrub: true } },
    );
    cleanups.push(() => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
  }

  root.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach((button) => {
    const original = button.textContent ?? '';
    let timer = 0;
    const onClick = async () => {
      const source = button.closest('.contact-row')?.querySelector('.contact-text') ?? undefined;
      const ok = await copyText(button.dataset.copy ?? '', source);
      const message = (ok ? button.dataset.copied : button.dataset.failed) ?? '';
      button.textContent = ok ? message : original;
      if (announcer) announcer.textContent = message;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        button.textContent = original;
        if (announcer) announcer.textContent = '';
        timers.delete(timer);
      }, FEEDBACK_MS);
      timers.add(timer);
    };
    button.addEventListener('click', onClick);
    cleanups.push(() => {
      button.removeEventListener('click', onClick);
      button.textContent = original;
    });
  });

  return () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
    cleanups.forEach((cleanup) => cleanup());
  };
}
