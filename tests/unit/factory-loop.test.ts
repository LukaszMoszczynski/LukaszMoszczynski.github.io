import { describe, expect, it } from 'vitest';
import { factorySequence } from '../../src/scripts/factory-loop';
import { FACTORY_NODES, nextRotation } from '../../src/scripts/factory-sequence';

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
