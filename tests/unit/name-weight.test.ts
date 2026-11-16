import { describe, expect, it } from 'vitest';
import { snapWeight, weightForDistance } from '../../src/scripts/name-weight';

describe('weightForDistance', () => {
  it('is heaviest at the pointer', () => expect(weightForDistance(0)).toBe(900));
  it('interpolates linearly', () => expect(weightForDistance(130)).toBe(600));
  it('stays light outside the radius', () => expect(weightForDistance(400)).toBe(300));
});

describe('snapWeight', () => {
  it('rounds to steps of 50', () => {
    expect(snapWeight(624)).toBe(600);
    expect(snapWeight(626)).toBe(650);
  });
  it('keeps the ends of the range', () => {
    expect(snapWeight(300)).toBe(300);
    expect(snapWeight(900)).toBe(900);
  });
});
