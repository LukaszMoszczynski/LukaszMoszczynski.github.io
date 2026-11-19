/**
 * "Pause animations" (WCAG 2.2.2): one switch that stops everything that moves on its own
 * (grid tracers, the drifting glow on touch screens, the agent log replay). Scroll- and
 * pointer-driven motion is started by the reader, so it stays. The choice lives on <html>
 * as PAUSE_CLASS (the head script in BaseLayout applies it before the first paint) and in
 * localStorage. GSAP-free, so server-side imports stay light.
 */
export const PAUSE_KEY = 'motion-paused';
export const PAUSE_CLASS = 'motion-paused';
export const PAUSE_EVENT = 'motion-pause-change';

/** The stored choice; false when storage is unavailable. */
export function storedPause(): boolean {
  try {
    return localStorage.getItem(PAUSE_KEY) === '1';
  } catch {
    return false;
  }
}

export function motionPaused(): boolean {
  return document.documentElement.classList.contains(PAUSE_CLASS);
}

export function setMotionPaused(paused: boolean): void {
  document.documentElement.classList.toggle(PAUSE_CLASS, paused);
  try {
    if (paused) localStorage.setItem(PAUSE_KEY, '1');
    else localStorage.removeItem(PAUSE_KEY);
  } catch {
    // storage unavailable: the choice lasts until the next full page load (the head script in
    // BaseLayout carries the class over on client-side navigations)
  }
  document.dispatchEvent(new CustomEvent(PAUSE_EVENT, { detail: { paused } }));
}

/** Calls `handler` whenever the switch changes; returns the unsubscribe. */
export function onMotionPauseChange(handler: (paused: boolean) => void): () => void {
  const listener = (event: Event) => handler(Boolean((event as CustomEvent<{ paused: boolean }>).detail?.paused));
  document.addEventListener(PAUSE_EVENT, listener);
  return () => document.removeEventListener(PAUSE_EVENT, listener);
}
