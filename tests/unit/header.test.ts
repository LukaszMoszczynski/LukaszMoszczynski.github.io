import { describe, expect, it } from 'vitest';
import { samePageHash, trapIndex } from '../../src/scripts/header-model';

describe('samePageHash', () => {
  const here = new URL('https://x.dev/portfolio-preview/');
  it('returns the hash of a link to a section of this page', () => {
    expect(samePageHash('/portfolio-preview/#contact', here)).toBe('#contact');
  });
  it('is null for another page or a link without a hash', () => {
    expect(samePageHash('/portfolio-preview/work/', here)).toBeNull();
    expect(samePageHash('/portfolio-preview/pl/#contact', here)).toBeNull();
    expect(samePageHash('/portfolio-preview/', here)).toBeNull();
  });
});

describe('trapIndex', () => {
  it('wraps forwards and backwards', () => {
    expect(trapIndex(2, 3, false)).toBe(0);
    expect(trapIndex(0, 3, true)).toBe(2);
    expect(trapIndex(1, 3, false)).toBe(2);
  });
  it('starts at an end when focus is outside the trap', () => {
    expect(trapIndex(-1, 4, false)).toBe(0);
    expect(trapIndex(-1, 4, true)).toBe(3);
  });
  it('has nothing to do with an empty trap', () => expect(trapIndex(0, 0, false)).toBe(-1));
});
