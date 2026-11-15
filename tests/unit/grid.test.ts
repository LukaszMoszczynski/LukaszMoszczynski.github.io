import { describe, expect, it } from 'vitest';
import { CELL, cellOrigin, gridLines, nearestCrossing } from '../../src/scripts/grid';

describe('gridLines', () => {
  const lines = gridLines(1000, 400);

  it('uses 96 px cells by default', () => {
    expect(CELL).toBe(96);
  });
  it('centres the columns horizontally', () => {
    expect(lines.offsetX).toBe(20);
    expect(lines.columns[0]).toBe(20);
    expect(lines.columns.at(-1)).toBe(980);
  });
  it('starts rows one cell from the top', () => {
    expect(lines.rows).toEqual([96, 192, 288, 384]);
  });
  it('honours a custom cell size', () => {
    expect(gridLines(100, 100, 50)).toEqual({ columns: [0, 50, 100], rows: [50, 100], offsetX: 0 });
  });
});

describe('nearestCrossing', () => {
  const lines = gridLines(1000, 400);

  it('snaps to the closest column and treats the top edge as a row', () => {
    expect(nearestCrossing(60, 40, lines)).toEqual({ x: 20, y: 0 });
  });
  it('picks the closer column even when it is to the right', () => {
    expect(nearestCrossing(70, 40, lines)).toEqual({ x: 116, y: 0 });
  });
  it('snaps to an inner row', () => {
    expect(nearestCrossing(500, 200, lines)).toEqual({ x: 500, y: 192 });
  });
});

describe('cellOrigin', () => {
  it('returns the top-left corner of the cell under the point', () => {
    expect(cellOrigin(130, 100, gridLines(1000, 400))).toEqual({ x: 116, y: 96 });
  });
});
