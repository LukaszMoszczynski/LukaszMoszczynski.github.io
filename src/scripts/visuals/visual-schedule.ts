/**
 * Which project visuals may play right now. GSAP-free, so the rules are unit-tested.
 *
 * A visual plays while it is in view, unless motion is blocked (Pause animations, a hidden
 * tab). In the sticky Selected work stack the earlier cards stay "in view" under the later
 * ones, so there only the front card plays: the last card whose top has come up to the
 * upper half of the screen, or, before any has, the first one in view.
 */

export interface VisualSlot {
  inView: boolean;
  /** Top of the visual's card in viewport px when the card sits in the sticky stack; null otherwise. */
  stackTop: number | null;
}

export interface ScheduleOptions {
  blocked: boolean;
  viewportHeight: number;
}

/** A stacked card counts as in front once its top has passed this share of the viewport. */
export const FRONT_LINE = 0.5;

export function playingVisuals(slots: readonly VisualSlot[], options: ScheduleOptions): boolean[] {
  if (options.blocked) return slots.map(() => false);
  const stacked = slots.map((slot, index) => ({ slot, index })).filter(({ slot }) => slot.inView && slot.stackTop !== null);
  let front = -1;
  for (const { slot, index } of stacked) {
    if ((slot.stackTop as number) <= options.viewportHeight * FRONT_LINE) front = index;
  }
  if (front === -1 && stacked.length) front = stacked[0].index;
  return slots.map((slot, index) => (slot.stackTop === null ? slot.inView : index === front));
}
