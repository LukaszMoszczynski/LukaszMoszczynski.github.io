import { describe, expect, it } from 'vitest';
import { BUILD_STATES, stepScrollTop } from '../../src/scripts/token-build';

describe('BUILD_STATES', () => {
  it('has 4 states of 6 pieces', () => {
    expect(BUILD_STATES.length).toBe(4);
    expect(BUILD_STATES.every((state) => state.length === 6)).toBe(true);
  });
  it('every piece has left, top, width, height, radius', () => {
    expect(BUILD_STATES.flat().every((piece) => piece.length === 5)).toBe(true);
  });
  it('ends with the page filling the frame', () => expect(BUILD_STATES[3][0]).toEqual([2, 2, 96, 96, 16]));
});

describe('stepScrollTop', () => {
  it('maps a step to its share of the pin', () => expect(stepScrollTop(1000, 2000, 2, 4)).toBeCloseTo(1666.67, 1));
  it('first step is the pin start', () => expect(stepScrollTop(1000, 2000, 0, 4)).toBe(1000));
  it('last step is the pin end', () => expect(stepScrollTop(1000, 2000, 3, 4)).toBe(2000));
});
