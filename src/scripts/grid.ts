/** Blueprint grid geometry — pure functions, no DOM. */

export const CELL = 96;

export interface GridLines {
  /** x positions of vertical lines */
  columns: number[];
  /** y positions of horizontal lines (the top edge, y = 0, is implicit) */
  rows: number[];
  /** horizontal shift that centres the columns in the viewport */
  offsetX: number;
}

export interface Point { x: number; y: number }

export function gridLines(width: number, height: number, cell: number = CELL): GridLines {
  const offsetX = (width % cell) / 2;
  const columns: number[] = [];
  const rows: number[] = [];
  for (let x = offsetX; x <= width; x += cell) columns.push(x);
  for (let y = cell; y <= height; y += cell) rows.push(y);
  return { columns, rows, offsetX };
}

function closest(values: number[], target: number): number {
  return values.reduce((best, value) => (Math.abs(value - target) < Math.abs(best - target) ? value : best));
}

/** The grid crossing nearest to a point; the top edge counts as a row. */
export function nearestCrossing(x: number, y: number, lines: GridLines): Point {
  return { x: closest(lines.columns, x), y: closest([0, ...lines.rows], y) };
}

/** Top-left corner of the cell that contains the point. */
export function cellOrigin(x: number, y: number, lines: GridLines, cell: number = CELL): Point {
  return {
    x: Math.floor((x - lines.offsetX) / cell) * cell + lines.offsetX,
    y: Math.floor(y / cell) * cell,
  };
}

/** Ambient tracer length in grid cells and duration factor (1 = the base speed). */
export const TRACER_CELLS = { min: 2, max: 8 } as const;
export const TRACER_DURATION = { min: 0.6, max: 1.8 } as const;

export interface TracerShape { cells: number; durationFactor: number }

/** A random ambient tracer: a whole number of cells and a duration factor, both within their ranges. */
export function tracerShape(random: () => number = Math.random): TracerShape {
  const cells = TRACER_CELLS.min + Math.floor(random() * (TRACER_CELLS.max - TRACER_CELLS.min + 1));
  const durationFactor = TRACER_DURATION.min + random() * (TRACER_DURATION.max - TRACER_DURATION.min);
  return { cells: Math.min(cells, TRACER_CELLS.max), durationFactor };
}
