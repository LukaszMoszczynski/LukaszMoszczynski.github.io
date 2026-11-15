import { gsap } from './lifecycle';

/** Splits `text` into words; joined by a single space they give back the original. */
export function splitWords(text: string): string[] {
  return text.split(' ').filter((word) => word.length > 0);
}

/**
 * Word-by-word light-up of the statement. Server render is plain text; with
 * motion the words are wrapped in `.word` spans and scrubbed from dim to full.
 * Cleanup restores the original text.
 */
export function initStatement(root: HTMLElement): () => void {
  const paragraph = root.querySelector<HTMLElement>('p');
  if (!paragraph) return () => {};
  const original = paragraph.textContent ?? '';
  paragraph.replaceChildren();
  splitWords(original).forEach((word, index) => {
    if (index > 0) paragraph.append(' ');
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = word;
    paragraph.append(span);
  });

  gsap.fromTo(
    paragraph.querySelectorAll('.word'),
    { opacity: 0.18 },
    { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: paragraph, start: 'top 80%', end: 'bottom 45%', scrub: true } },
  );

  return () => {
    paragraph.textContent = original;
  };
}
