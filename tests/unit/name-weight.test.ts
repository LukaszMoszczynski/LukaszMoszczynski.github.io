import { describe, expect, it } from 'vitest';
import { weightForDistance } from '../../src/scripts/name-weight';

describe('weightForDistance', () => {
  it('is heaviest at the pointer', () => expect(weightForDistance(0)).toBe(900));
  it('interpolates linearly', () => expect(weightForDistance(130)).toBe(600));
  it('stays light outside the radius', () => expect(weightForDistance(400)).toBe(300));
});
