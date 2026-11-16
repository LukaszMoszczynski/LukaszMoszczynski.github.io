import { describe, expect, it } from 'vitest';
import { factorySequence } from '../../src/scripts/factory-loop';
import { FACTORY_NODES, arcShare, nextRotation, ringStops } from '../../src/scripts/factory-sequence';

describe('factorySequence', () => {
  it('goes straight to clean without review comments', () => {
    expect(factorySequence(0)).toEqual(['label', 'factory', 'push', 'review', 'clean']);
  });
  it('adds comments → fix → push → review per cycle', () => {
    expect(factorySequence(1)).toEqual(['label', 'factory', 'push', 'review', 'comments', 'fix', 'push', 'review', 'clean']);
    expect(factorySequence(2)).toHaveLength(13);
  });
  it('always starts at the label and ends clean', () => {
    for (const cycles of [0, 1, 2]) {
      const sequence = factorySequence(cycles);
      expect(sequence[0]).toBe('label');
      expect(sequence.at(-1)).toBe('clean');
      expect(sequence.filter((stage) => stage === 'clean')).toHaveLength(1);
    }
  });
});

describe('ring', () => {
  it('has six nodes and every stage but clean is a node', () => {
    expect(FACTORY_NODES).toEqual(['label', 'factory', 'push', 'review', 'comments', 'fix']);
  });
  it('turns clockwise only, by the shortest clockwise distance', () => {
    expect(nextRotation(0, 'factory')).toBe(60);
    expect(nextRotation(300, 'push')).toBe(480);
    expect(nextRotation(480, 'push')).toBe(480);
    expect(nextRotation(0, 'label')).toBe(0);
  });
});

describe('ringStops', () => {
  it('walks the ring clockwise, and on round for a review cycle', () => {
    expect(ringStops(1)).toEqual([
      { stage: 'label', rotation: 0 },
      { stage: 'factory', rotation: 60 },
      { stage: 'push', rotation: 120 },
      { stage: 'review', rotation: 180 },
      { stage: 'comments', rotation: 240 },
      { stage: 'fix', rotation: 300 },
      { stage: 'push', rotation: 480 },
      { stage: 'review', rotation: 540 },
    ]);
  });
  it('never includes the hub', () => {
    expect(ringStops(0).map((stop) => stop.stage)).toEqual(['label', 'factory', 'push', 'review']);
  });
});

describe('arcShare', () => {
  it('grows with the rotation and stays full after one lap', () => {
    expect(arcShare(0)).toBe(0);
    expect(arcShare(180)).toBe(0.5);
    expect(arcShare(360)).toBe(1);
    expect(arcShare(540)).toBe(1);
  });
});
