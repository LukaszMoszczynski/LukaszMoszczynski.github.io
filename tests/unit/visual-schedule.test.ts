import { describe, expect, it } from 'vitest';
import { playingVisuals, type VisualSlot } from '../../src/scripts/visuals/visual-schedule';

const free = (inView: boolean): VisualSlot => ({ inView, stackTop: null });
const stacked = (inView: boolean, stackTop: number): VisualSlot => ({ inView, stackTop });
const options = { blocked: false, viewportHeight: 900 };

describe('playingVisuals', () => {
  it('plays every free visual that is in view', () => {
    expect(playingVisuals([free(true), free(false), free(true)], options)).toEqual([true, false, true]);
  });

  it('plays nothing while motion is blocked', () => {
    expect(playingVisuals([free(true), stacked(true, 88)], { ...options, blocked: true })).toEqual([false, false]);
  });

  it('plays only the front card of the sticky stack', () => {
    // Cards 0 and 1 sit at their sticky tops, card 2 is sliding in from below.
    expect(playingVisuals([stacked(true, 88), stacked(true, 104), stacked(true, 700)], options)).toEqual([false, true, false]);
  });

  it('hands over once the next card passes the upper half', () => {
    expect(playingVisuals([stacked(true, 88), stacked(true, 451)], options)).toEqual([true, false]);
    expect(playingVisuals([stacked(true, 88), stacked(true, 450)], options)).toEqual([false, true]);
  });

  it('plays the first stacked card in view before any reaches the upper half', () => {
    expect(playingVisuals([stacked(false, 1200), stacked(true, 800), stacked(true, 1300)], options)).toEqual([false, true, false]);
  });

  it('never plays a stacked card out of view', () => {
    expect(playingVisuals([stacked(false, 88), stacked(false, 104)], options)).toEqual([false, false]);
  });

  it('treats stacked and free visuals separately', () => {
    expect(playingVisuals([stacked(true, 88), stacked(true, 104), free(true)], options)).toEqual([false, true, true]);
  });
});
