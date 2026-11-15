import { describe, expect, it } from 'vitest';
import { cardPose, rotateDeck, shouldDismiss } from '../../src/scripts/deck-model';

describe('deck model', () => {
  it('rotateDeck moves the first card to the end without mutating', () => {
    const order = ['a', 'b', 'c'];
    expect(rotateDeck(order)).toEqual(['b', 'c', 'a']);
    expect(order).toEqual(['a', 'b', 'c']);
  });
  it('cardPose stacks cards behind the top one', () => {
    expect(cardPose(1, 3)).toEqual({ x: 0, y: 16, scale: 0.95, rotation: -3, zIndex: 2 });
    expect(cardPose(0, 3)).toEqual({ x: 0, y: 0, scale: 1, rotation: 0, zIndex: 3 });
    expect(cardPose(2, 3).rotation).toBe(3);
  });
  it('shouldDismiss needs more than the threshold in either direction', () => {
    expect(shouldDismiss(-111)).toBe(true);
    expect(shouldDismiss(80)).toBe(false);
    expect(shouldDismiss(110)).toBe(false);
    expect(shouldDismiss(50, 40)).toBe(true);
  });
});
