import { describe, expect, it } from 'vitest';
import { CELL, TRACER_CELLS, TRACER_DELAY, TRACER_DURATION, TRACER_EASES, TRACER_LINGER, cellOrigin, gridLines, nearestCrossing, tracerShape } from '../../src/scripts/grid';

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
  it('stays within every range', () => {
    for (let run = 0; run < 500; run++) {
      const { cells, durationFactor, ease, delay, linger } = tracerShape();
      expect(Number.isInteger(cells)).toBe(true);
      expect(cells).toBeGreaterThanOrEqual(TRACER_CELLS.min);
      expect(cells).toBeLessThanOrEqual(TRACER_CELLS.max);
      expect(durationFactor).toBeGreaterThanOrEqual(TRACER_DURATION.min);
      expect(durationFactor).toBeLessThanOrEqual(TRACER_DURATION.max);
      expect(TRACER_EASES).toContain(ease);
      expect(delay).toBeGreaterThanOrEqual(TRACER_DELAY.min);
      expect(delay).toBeLessThanOrEqual(TRACER_DELAY.max);
      expect(linger).toBeGreaterThanOrEqual(TRACER_LINGER.min);
      expect(linger).toBeLessThanOrEqual(TRACER_LINGER.max);
    }
  });
  it('reaches both ends of the ranges', () => {
    expect(tracerShape(() => 0)).toEqual({ cells: 2, durationFactor: 0.45, ease: TRACER_EASES[0], delay: 0, linger: 0.1 });
    const top = tracerShape(() => 0.999999);
    expect(top.cells).toBe(8);
    expect(top.durationFactor).toBeCloseTo(2.2, 4);
    expect(top.ease).toBe(TRACER_EASES.at(-1));
    expect(top.delay).toBeCloseTo(0.6, 4);
    expect(top.linger).toBeCloseTo(0.8, 4);
  });
  it('points differ in speed, ease and timing, not only in length', () => {
    const shapes = Array.from({ length: 200 }, () => tracerShape());
    expect(new Set(shapes.map((shape) => shape.ease)).size).toBeGreaterThan(3);
    const speeds = shapes.map((shape) => shape.durationFactor);
    expect(Math.max(...speeds) / Math.min(...speeds)).toBeGreaterThan(2.5);
    expect(new Set(shapes.map((shape) => shape.delay.toFixed(2))).size).toBeGreaterThan(20);
  });
});
