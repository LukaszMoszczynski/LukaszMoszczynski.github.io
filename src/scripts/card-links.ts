/** Project cards on the home stack (the /work/ cards already have a stretched title link). */
export const CARD_SELECTOR = '.project-card';
/** Clicks on these inside a card keep their own meaning. */
const OWN_ACTION = 'a[href], button, [role=button], [role=switch], input, textarea, select, summary, label';

/**
 * A click anywhere on a project card opens its case study (the custom cursor shows "Open"
 * there), by clicking the card's own link so the router and its view transition run as usual.
 * Not when the click was on another control, with a modifier key, or after selecting text.
 */
export function initCardLinks(): () => void {
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest<HTMLElement>(CARD_SELECTOR);
    if (!card || target?.closest(OWN_ACTION)) return;
    if (String(window.getSelection() ?? '').trim()) return;
    card.querySelector<HTMLAnchorElement>('a[href]')?.click();
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}
