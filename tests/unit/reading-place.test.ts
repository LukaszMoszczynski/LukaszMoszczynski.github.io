import { describe, expect, it } from 'vitest';
import { measurePlace, parsePlace, PLACE_MAX_AGE_MS, resolvePlace, segmentBounds, type Anchor } from '../../src/scripts/reading-place';

const english: Anchor[] = [
  { id: 'stack', top: 1000 },
  { id: 'work', top: 2000 },
  { id: 'contact', top: 4000 },
];
// The other language: same sections, longer text.
const polish: Anchor[] = [
  { id: 'stack', top: 1200 },
  { id: 'work', top: 2600 },
  { id: 'contact', top: 4800 },
];

describe('segmentBounds', () => {
  it('runs from an anchor to the next one, the last one to the page end, -1 from the top', () => {
    expect(segmentBounds(english, 0, 5000)).toEqual([1000, 2000]);
    expect(segmentBounds(english, 2, 5000)).toEqual([4000, 5000]);
    expect(segmentBounds(english, -1, 5000)).toEqual([0, 1000]);
  });
});

describe('measurePlace and resolvePlace', () => {
  it('keeps the same section and fraction on a page with different section lengths', () => {
    const place = measurePlace(english, 1500, 5000, 900, '/pl/', 0);
    expect(place).toMatchObject({ id: 'stack', index: 0, count: 3, fraction: 0.5 });
    expect(resolvePlace(place, polish, 6000, 900, '/pl/', 100)).toBe(1900);
  });

  it('places a reader before the first anchor by the fraction of that part', () => {
    const place = measurePlace(english, 250, 5000, 900, '/pl/', 0);
    expect(place).toMatchObject({ id: '', index: -1, fraction: 0.25 });
    expect(resolvePlace(place, polish, 6000, 900, '/pl/', 0)).toBe(300);
  });

  it('matches a translated anchor id by position when both pages have the same number of anchors', () => {
    const place = measurePlace([{ id: 'problem', top: 1000 }, { id: 'what-i-built', top: 2000 }], 2500, 3000, 900, '/pl/work/dcc/', 0);
    expect(resolvePlace(place, [{ id: 'problem', top: 1000 }, { id: 'co-zbudowalem', top: 2200 }], 3400, 900, '/pl/work/dcc/', 0)).toBe(2800);
  });

  it('falls back to the fraction of the page when the anchor cannot be matched', () => {
    const place = measurePlace(english, 2050, 5000, 1000, '/pl/', 0);
    expect(place.pageFraction).toBeCloseTo(2050 / 4000);
    expect(resolvePlace(place, [{ id: 'other', top: 10 }], 9000, 1000, '/pl/', 0)).toBe(Math.round((2050 / 4000) * 8000));
  });

  it('ignores a place for another page or an old one', () => {
    const place = measurePlace(english, 1500, 5000, 900, '/pl/', 1000);
    expect(resolvePlace(place, polish, 6000, 900, '/pl/work/', 1000)).toBeNull();
    expect(resolvePlace(place, polish, 6000, 900, '/pl/', 1000 + PLACE_MAX_AGE_MS + 1)).toBeNull();
    expect(resolvePlace(place, polish, 6000, 900, '/pl/', 999)).toBeNull();
  });
});

describe('parsePlace', () => {
  it('reads what measurePlace stored and rejects anything else', () => {
    const place = measurePlace(english, 1500, 5000, 900, '/pl/', 5);
    expect(parsePlace(JSON.stringify(place))).toEqual(place);
    expect(parsePlace(null)).toBeNull();
    expect(parsePlace('{')).toBeNull();
    expect(parsePlace(JSON.stringify({ ...place, fraction: 'half' }))).toBeNull();
  });
});
