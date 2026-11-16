import { describe, expect, it } from 'vitest';
import { focusScrollTarget, stickyTop } from '../../src/scripts/work-focus';

describe('focusScrollTarget', () => {
  it('stacked: puts the card at its sticky top, before the next card slides over it', () => {
    expect(stickyTop(2)).toBe(120);
    expect(focusScrollTarget({ index: 2, naturalTop: 5000, height: 500 }, { scrollY: 6373, height: 900, stacked: true })).toBe(4880);
    expect(focusScrollTarget({ index: 2, naturalTop: 5000, height: 500 }, { scrollY: 4880, height: 900, stacked: true })).toBeNull();
  });

  it('not stacked: leaves a card that is already whole below the header', () => {
    expect(focusScrollTarget({ index: 0, naturalTop: 1100, height: 500 }, { scrollY: 1000, height: 740, stacked: false })).toBeNull();
  });

  it('not stacked: brings a card cut at the top below the header', () => {
    expect(focusScrollTarget({ index: 0, naturalTop: 1000, height: 500 }, { scrollY: 1100, height: 740, stacked: false })).toBe(912);
  });

  it('not stacked: lifts a card cut at the bottom just enough', () => {
    expect(focusScrollTarget({ index: 0, naturalTop: 1500, height: 500 }, { scrollY: 1000, height: 740, stacked: false })).toBe(1276);
  });

  it('not stacked: a card taller than the room starts below the header', () => {
    expect(focusScrollTarget({ index: 0, naturalTop: 1500, height: 900 }, { scrollY: 1000, height: 740, stacked: false })).toBe(1412);
  });
});
