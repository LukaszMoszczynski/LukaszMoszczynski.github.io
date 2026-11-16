import { gsap } from '../lifecycle';

/**
 * Shared shape of a project visual story. Each story module exports a factory that builds a
 * paused, endlessly repeating timeline for one `.project-screen`:
 *
 *   opening frame → build-up → DONE_LABEL (the finished frame) → hold → outro → rest → repeat
 *
 * The finished frame is exactly what the server renders, so no JS, reduced motion and Pause
 * animations all show it, and a timeline that starts at DONE_LABEL never jumps. The outro
 * brings every animated property back to the opening frame, so the repeat never snaps.
 */
export type StoryFactory = (screen: HTMLElement) => gsap.core.Timeline;

/** Marks story timelines (`timeline.data`), so tests can tell them from other timelines. */
export const STORY_TAG = 'project-visual';
export const DONE_LABEL = 'done';
export const HOLD_SECONDS = 1.4;
export const REST_SECONDS = 0.6;

export function storyTimeline(): gsap.core.Timeline {
  return gsap.timeline({
    paused: true,
    repeat: -1,
    repeatDelay: REST_SECONDS,
    data: STORY_TAG,
    defaults: { duration: 0.5, ease: 'power2.out' },
  });
}

/** Marks the finished frame at the current end of the timeline and holds it. */
export function markDone(timeline: gsap.core.Timeline): void {
  timeline.addLabel(DONE_LABEL);
  timeline.to({}, { duration: HOLD_SECONDS });
}

/** Every element in the screen matching `selector`; a story with missing markup is a bug, so it throws. */
export function parts<T extends Element = HTMLElement>(screen: HTMLElement, selector: string): T[] {
  const found = [...screen.querySelectorAll<T>(selector)];
  if (!found.length) throw new Error(`Project visual: nothing matches "${selector}"`);
  return found;
}

/** The single element matching `selector` (see `parts`). */
export function part<T extends Element = HTMLElement>(screen: HTMLElement, selector: string): T {
  return parts<T>(screen, selector)[0];
}
