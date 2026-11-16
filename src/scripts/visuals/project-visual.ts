import { gsap } from '../lifecycle';
import { motionPaused, onMotionPauseChange } from '../motion-pause';
import { STACK_MEDIA } from '../work-focus';
import { DONE_LABEL, STORY_TAG, type StoryFactory } from './story';
import { STORIES } from './stories';
import { playingVisuals } from './visual-schedule';

/** `data-visual-state` on `.project-visual`: playing, held mid-story, or at rest on the finished frame. */
export type VisualState = 'playing' | 'held' | 'at-rest';

export interface ProjectVisual {
  root: HTMLElement;
  play(): void;
  /** Holds the current frame (off screen, hidden tab, behind another card). */
  hold(): void;
  /** Drops the timeline and shows the finished frame the server rendered (Pause animations). */
  rest(): void;
  destroy(): void;
}

/**
 * One project visual: finds its story by `data-visual` and builds the timeline the first
 * time it plays. The timeline lives in its own gsap.context (it is created after the page
 * setup, so the page context does not track it); `rest` and `destroy` revert that context.
 * Returns null when the visual has no story.
 */
export function initProjectVisual(root: HTMLElement): ProjectVisual | null {
  const screen = root.querySelector<HTMLElement>('.project-screen');
  const build: StoryFactory | undefined = STORIES[root.dataset.visual ?? ''];
  if (!screen || !build) return null;
  let context: gsap.Context | undefined;
  let timeline: gsap.core.Timeline | undefined;
  const setState = (state: VisualState) => {
    root.dataset.visualState = state;
  };

  const rest = () => {
    context?.revert();
    context = undefined;
    timeline = undefined;
    setState('at-rest');
  };
  setState('at-rest');

  return {
    root,
    play() {
      if (!timeline) {
        context = gsap.context(() => {
          timeline = build(screen);
          // Start on the finished frame the reader already sees, so nothing jumps.
          timeline.seek(DONE_LABEL);
        }, screen);
      }
      timeline?.play();
      setState('playing');
    },
    hold() {
      if (!timeline) return;
      timeline.pause();
      setState('held');
    },
    rest,
    destroy() {
      rest();
      delete root.dataset.visualState;
    },
  };
}

/**
 * Every project visual under `scope` (call only with motion enabled). Visuals play while in
 * view (IntersectionObserver), hold off screen, behind the front card of the home stack and
 * while the tab is hidden, and rest on their finished frame under Pause animations.
 * The cleanup disconnects everything and reverts every story, so no timeline outlives the page.
 */
export function initProjectVisuals(scope: ParentNode): () => void {
  const visuals = [...scope.querySelectorAll<HTMLElement>('.project-visual[data-visual]')]
    .map((root) => initProjectVisual(root))
    .filter((visual): visual is ProjectVisual => visual !== null);
  if (!visuals.length) return () => {};

  const inView = new Map<HTMLElement, boolean>(visuals.map((visual) => [visual.root, false]));
  const stackCards = visuals.map((visual) => visual.root.closest<HTMLElement>('.work-stack .project-card'));
  const stackMedia = matchMedia(STACK_MEDIA);
  let frame = 0;

  const update = () => {
    frame = 0;
    const stacked = stackMedia.matches;
    // Reads first (card tops), then the writes in play/hold/rest.
    const slots = visuals.map((visual, index) => {
      const card = stackCards[index];
      return { inView: inView.get(visual.root) ?? false, stackTop: stacked && card ? card.getBoundingClientRect().top : null };
    });
    const paused = motionPaused();
    const playing = playingVisuals(slots, { blocked: paused || document.hidden, viewportHeight: window.innerHeight });
    visuals.forEach((visual, index) => {
      if (playing[index]) visual.play();
      else if (paused) visual.rest();
      else visual.hold();
    });
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) inView.set(entry.target as HTMLElement, entry.isIntersecting);
      schedule();
    },
    { threshold: 0.2 },
  );
  visuals.forEach((visual) => observer.observe(visual.root));

  // Only the sticky stack needs scroll positions: its cards stay in view under each other.
  const watchScroll = stackCards.some((card) => card !== null);
  if (watchScroll) window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', update);
  const stopPauseWatch = onMotionPauseChange(update);

  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    if (watchScroll) window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('visibilitychange', update);
    stopPauseWatch();
    visuals.forEach((visual) => visual.destroy());
  };
}

/**
 * Story timelines GSAP still runs, and how many of them animate elements no longer in the
 * page. Exposed on `window.projectVisualTimelines` so the e2e tests can prove that page
 * changes leave none behind (GSAP itself is bundled, not global).
 */
export function storyTimelines(): { live: number; detached: number } {
  const stories = gsap.globalTimeline.getChildren(false, false, true).filter((child) => child.data === STORY_TAG) as gsap.core.Timeline[];
  const detached = stories.filter((story) =>
    story.getChildren(true, true, false).some((tween) => (tween as gsap.core.Tween).targets().some((target) => target instanceof Node && !target.isConnected)),
  );
  return { live: stories.length, detached: detached.length };
}
if (typeof window !== 'undefined') (window as Window & { projectVisualTimelines?: typeof storyTimelines }).projectVisualTimelines = storyTimelines;
