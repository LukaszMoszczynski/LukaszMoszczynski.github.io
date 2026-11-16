import { navigate } from 'astro:transitions/client';
import { expectLanguageSwitch, gsap, motionEnabled } from './lifecycle';
import { samePageHash, trapIndex } from './header-model';
import { rememberPlace } from './reading-place';

/** How long the language thumb slides before the page changes. */
const LANG_SLIDE_MS = 280;
const FOCUSABLE = 'a[href], button:not([disabled])';

/**
 * Header: hamburger menu as a modal dialog (wipe in from the button, links rise in
 * a stagger, closing reverses; focus trapped, Escape and link clicks close it, page
 * scroll locked while open), plus the language switch whose thumb slides before the
 * page changes. Reduced motion: everything happens instantly. Cleanup closes the menu
 * and kills its tweens, so a view-transition navigation never leaves it open.
 */
export function initHeader(root: HTMLElement): () => void {
  const toggle = root.querySelector<HTMLButtonElement>('.menu-toggle');
  const panel = root.querySelector<HTMLElement>('#site-menu');
  const removers: Array<() => void> = [];
  const listen = <K extends keyof (HTMLElementEventMap & DocumentEventMap)>(
    target: EventTarget, type: K, handler: (event: (HTMLElementEventMap & DocumentEventMap)[K]) => void,
  ) => {
    target.addEventListener(type, handler as EventListener);
    removers.push(() => target.removeEventListener(type, handler as EventListener));
  };
  const motion = motionEnabled();
  let langTimer: number | undefined;

  // Language: remember the reader's place for the other page, let the thumb slide, then go.
  // Without motion the link just works (the place is still remembered).
  const langLink = root.querySelector<HTMLAnchorElement>('[data-lang-switch]');
  const langSeg = langLink?.closest<HTMLElement>('.lang-seg');
  if (langLink && langSeg) {
    listen(langLink, 'click', (event) => {
      const click = event as MouseEvent;
      if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey || click.button !== 0) return;
      // A second click while the thumb slides would queue a second navigation that cleanup never cancels.
      if (langTimer !== undefined) {
        event.preventDefault();
        return;
      }
      rememberPlace(new URL(langLink.href).pathname);
      expectLanguageSwitch(langLink.href);
      if (!motion) return;
      event.preventDefault();
      langSeg.dataset.current = langLink.hreflang;
      langSeg.classList.add('is-switching');
      langTimer = window.setTimeout(() => navigate(langLink.href), LANG_SLIDE_MS);
    });
  }

  if (!toggle || !panel) return () => removers.forEach((remove) => remove());

  const links = [...panel.querySelectorAll<HTMLAnchorElement>('a[href]')];
  const bigLinks = [...panel.querySelectorAll<HTMLElement>('.menu-link-text')];
  const smallItems = [...panel.querySelectorAll<HTMLElement>('.menu-sub, .menu-projects li')];
  let open = false;
  let timeline: gsap.core.Timeline | undefined;
  const behind = () => [...document.querySelectorAll<HTMLElement>('body > main, body > footer, body > .skip-link')];

  const setOpen = (value: boolean) => {
    open = value;
    toggle.setAttribute('aria-expanded', String(value));
    document.documentElement.classList.toggle('menu-open', value);
    // While the menu covers the page, the page behind it is out of reach for keyboard and screen readers.
    behind().forEach((element) => element.toggleAttribute('inert', value));
  };

  const show = () => {
    if (open) return;
    timeline?.kill();
    setOpen(true);
    panel.hidden = false;
    if (motion) {
      // The wipe grows from the centre of the button to beyond the farthest corner.
      const box = toggle.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      timeline = gsap.timeline();
      timeline
        .fromTo(panel, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${reach}px at ${x}px ${y}px)`, duration: 0.6, ease: 'power3.inOut' })
        .fromTo(bigLinks, { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: 'power3.out', stagger: 0.07 }, 0.22)
        .fromTo(smallItems, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.03 }, 0.4);
    }
    links[0]?.focus({ preventScroll: true });
  };

  const finishHide = () => {
    panel.hidden = true;
    gsap.set([panel, ...bigLinks, ...smallItems], { clearProps: 'all' });
  };
  const hide = ({ returnFocus = true, instant = false } = {}) => {
    if (!open) return;
    setOpen(false);
    // A timeline still at its very start (closed in the same frame it opened) would never report reverse-complete.
    if (motion && !instant && timeline && timeline.time() > 0.02) {
      timeline.eventCallback('onReverseComplete', finishHide);
      timeline.timeScale(1.6).reverse();
    } else {
      timeline?.kill();
      timeline = undefined;
      finishHide();
    }
    if (returnFocus) toggle.focus();
  };

  listen(toggle, 'click', () => (open ? hide() : show()));

  listen(document, 'keydown', (event) => {
    const key = event as KeyboardEvent;
    if (!open) return;
    if (key.key === 'Escape') {
      key.preventDefault();
      hide();
      return;
    }
    if (key.key !== 'Tab') return;
    // Trap: the header controls (logo, switches, close button) and the menu links.
    const trap = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => element.offsetParent !== null || element === toggle);
    const index = trap.indexOf(document.activeElement as HTMLElement);
    const next = trapIndex(index, trap.length, key.shiftKey);
    if (next < 0) return;
    key.preventDefault();
    trap[next].focus();
  });

  for (const link of links) {
    listen(link, 'click', (event) => {
      const hash = samePageHash(link.href, location);
      if (!hash) {
        // Another page: close at once and let the router (or the browser) navigate.
        hide({ returnFocus: false, instant: true });
        return;
      }
      // Same page: unlock the scroll first, then go to the section.
      event.preventDefault();
      hide({ returnFocus: false, instant: true });
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (location.hash !== hash) history.pushState(history.state, '', hash);
      // Instant: a smooth scroll across the pinned and sticky sections ends short of the target.
      target?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }

  return () => {
    removers.forEach((remove) => remove());
    clearTimeout(langTimer);
    langTimer = undefined;
    langSeg?.classList.remove('is-switching');
    timeline?.kill();
    timeline = undefined;
    if (open) setOpen(false);
    document.documentElement.classList.remove('menu-open');
    behind().forEach((element) => element.removeAttribute('inert'));
    finishHide();
  };
}
