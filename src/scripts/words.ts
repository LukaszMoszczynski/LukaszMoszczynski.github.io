import { gsap, quietArrival } from './lifecycle';

/** Splits `text` into words; joined by a single space they give back the original. */
export function splitWords(text: string): string[] {
  return text.split(' ').filter((word) => word.length > 0);
}

/** A statement whose top is above this share of the viewport height counts as visible at load (a peeking first line counts). */
const STATEMENT_IN_VIEW = 0.98;
/** The colour scrub runs from the section top at 60% of the viewport to its bottom at 30%. */
export const HEAT_START = 'top 60%';
export const HEAT_END = 'bottom 30%';

/**
 * Word-by-word light-up of the statement, then a word-by-word turn to orange as the reader
 * scrolls past it. Server render is plain text; with motion the words are wrapped in
 * `.word` spans, scrubbed from dim to full and then from ink to the text accent.
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

  const words = paragraph.querySelectorAll('.word');
  const box = paragraph.getBoundingClientRect();
  if (quietArrival() && box.top < innerHeight * STATEMENT_IN_VIEW) {
    // After a language switch the reader has seen it already: on screen or above, it stays lit.
  } else if (box.top < innerHeight * STATEMENT_IN_VIEW && box.bottom > 0) {
    // Already on screen at load (short hero, restored scroll): the words light up in sequence once and stay lit,
    // instead of waiting for a scroll that may never come.
    gsap.fromTo(words, { opacity: 0.18 }, { opacity: 1, duration: 0.5, stagger: { amount: 1.2 }, ease: 'power1.out', delay: 0.3 });
  } else {
    gsap.fromTo(
      words,
      { opacity: 0.18 },
      { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: paragraph, start: 'top 80%', end: 'bottom 45%', scrub: true } },
    );
  }

  // Reading on past it, the words turn from ink to the text accent one by one (--heat 0 → 1, CSS mixes
  // the colour, so a theme switch needs nothing here). Scrubbed both ways; a page loaded below it starts orange.
  gsap.fromTo(
    words,
    { '--heat': 0 },
    { '--heat': 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: root, start: HEAT_START, end: HEAT_END, scrub: true } },
  );

  return () => {
    paragraph.textContent = original;
  };
}
