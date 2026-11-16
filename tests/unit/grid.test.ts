import { describe, expect, it } from 'vitest';
import { CELL, TRACER_CELLS, TRACER_DURATION, cellOrigin, gridLines, nearestCrossing, tracerShape } from '../../src/scripts/grid';

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

describe('tracerShape', () => {
  it('stays within 2–8 cells and a 0.6–1.8 duration factor', () => {
    for (let run = 0; run < 500; run++) {
      const { cells, durationFactor } = tracerShape();
      expect(Number.isInteger(cells)).toBe(true);
      expect(cells).toBeGreaterThanOrEqual(TRACER_CELLS.min);
      expect(cells).toBeLessThanOrEqual(TRACER_CELLS.max);
      expect(durationFactor).toBeGreaterThanOrEqual(TRACER_DURATION.min);
      expect(durationFactor).toBeLessThanOrEqual(TRACER_DURATION.max);
    }
  });
  it('reaches both ends of the ranges', () => {
    expect(tracerShape(() => 0)).toEqual({ cells: 2, durationFactor: 0.6 });
    const top = tracerShape(() => 0.999999);
    expect(top.cells).toBe(8);
    expect(top.durationFactor).toBeCloseTo(1.8, 4);
  });
  it('the ranges are 2–8 cells and 0.6–1.8', () => {
    expect(TRACER_CELLS).toEqual({ min: 2, max: 8 });
    expect(TRACER_DURATION).toEqual({ min: 0.6, max: 1.8 });
  });
});
