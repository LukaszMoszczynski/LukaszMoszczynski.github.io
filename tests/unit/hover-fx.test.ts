import { describe, expect, it } from 'vitest';
import { MAGNET_MAX, magnetOffset } from '../../src/scripts/hover-fx';

describe('magnetOffset', () => {
  it('is 0 at the centre and the maximum at either edge', () => {
    expect(magnetOffset(150, 100, 100)).toBe(0);
    expect(magnetOffset(200, 100, 100)).toBe(MAGNET_MAX);
    expect(magnetOffset(100, 100, 100)).toBe(-MAGNET_MAX);
  });
  it('never pulls further than the maximum, which stays small', () => {
    expect(MAGNET_MAX).toBeLessThanOrEqual(6);
    expect(magnetOffset(1000, 100, 100)).toBe(MAGNET_MAX);
    expect(magnetOffset(-1000, 100, 100)).toBe(-MAGNET_MAX);
  });
  it('ignores empty boxes', () => expect(magnetOffset(10, 0, 0)).toBe(0));
});
