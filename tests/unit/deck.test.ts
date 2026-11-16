import { describe, expect, it } from 'vitest';
import { cardPose, positionLabel, rotateDeck, shouldDismiss, unrotateDeck } from '../../src/scripts/deck-model';

describe('deck model', () => {
  it('rotateDeck moves the first card to the end without mutating', () => {
    const order = ['a', 'b', 'c'];
    expect(rotateDeck(order)).toEqual(['b', 'c', 'a']);
    expect(order).toEqual(['a', 'b', 'c']);
  });
  it('unrotateDeck brings the last card back to the front and undoes rotateDeck', () => {
    const order = ['a', 'b', 'c'];
    expect(unrotateDeck(order)).toEqual(['c', 'a', 'b']);
    expect(unrotateDeck(rotateDeck(order))).toEqual(order);
    expect(order).toEqual(['a', 'b', 'c']);
    expect(unrotateDeck([])).toEqual([]);
  });
  it('positionLabel fills in the numbers', () => {
    expect(positionLabel('Recommendation {current} of {total}', 2, 3)).toBe('Recommendation 2 of 3');
    expect(positionLabel('Rekomendacja {current} z {total}', 1, 3)).toBe('Rekomendacja 1 z 3');
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
