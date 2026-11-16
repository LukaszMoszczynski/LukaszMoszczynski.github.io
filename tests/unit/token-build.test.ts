import { describe, expect, it } from 'vitest';
import { BUILD_STATES, BUILD_STEPS, layerOpacity, pieceStyle, stepScrollTop } from '../../src/scripts/token-build';

describe('BUILD_STATES', () => {
  it('has 5 states (tokens, atoms, molecules, organisms, pages) of 6 pieces', () => {
    expect(BUILD_STEPS).toEqual(['tokens', 'atoms', 'molecules', 'organisms', 'pages']);
    expect(BUILD_STATES.length).toBe(BUILD_STEPS.length);
    expect(BUILD_STATES.every((state) => state.length === 6)).toBe(true);
  });
  it('every piece has left, top, width, height, radius and an optional opacity', () => {
    expect(BUILD_STATES.flat().every((piece) => piece.length === 5 || piece.length === 6)).toBe(true);
  });
  it('ends with the page filling the frame', () => expect(BUILD_STATES[4][0]).toEqual([2, 2, 96, 96, 16]));
  it('hides only the space token among the atoms', () => {
    expect(BUILD_STATES[1].map((piece) => pieceStyle(piece).opacity)).toEqual([1, 1, 1, 0, 1, 1]);
  });
  it('keeps the pieces inside the frame', () => {
    for (const [left, top, width, height] of BUILD_STATES.flat()) {
      expect(left + width).toBeLessThanOrEqual(100);
      expect(top + height).toBeLessThanOrEqual(100);
    }
  });
});

describe('layerOpacity', () => {
  it('shows token labels only at tokens, atom faces only at atoms, fills from molecules on', () => {
    expect(BUILD_STEPS.map((_, index) => layerOpacity(index))).toEqual([
      { tags: 1, atoms: 0, fills: 0, glyph: 1, label: 0 },
      { tags: 0, atoms: 1, fills: 0, glyph: 0, label: 1 },
      { tags: 0, atoms: 0, fills: 1, glyph: 0, label: 1 },
      { tags: 0, atoms: 0, fills: 1, glyph: 0, label: 1 },
      { tags: 0, atoms: 0, fills: 1, glyph: 0, label: 1 },
    ]);
  });
});

describe('stepScrollTop', () => {
  it('maps a step to its share of the pin', () => expect(stepScrollTop(1000, 2000, 2, 5)).toBe(1500));
  it('first step is the pin start', () => expect(stepScrollTop(1000, 2000, 0, 5)).toBe(1000));
  it('last step is the pin end', () => expect(stepScrollTop(1000, 2000, 4, 5)).toBe(2000));
});
