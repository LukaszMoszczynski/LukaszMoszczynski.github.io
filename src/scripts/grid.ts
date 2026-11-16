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

/** Ambient tracer length in grid cells and duration factor (1 = the base speed; below 1 is faster). */
export const TRACER_CELLS = { min: 2, max: 8 } as const;
export const TRACER_DURATION = { min: 0.45, max: 2.2 } as const;
/** Seconds a tracer waits before it starts drawing, and stays lit before it fades. */
export const TRACER_DELAY = { min: 0, max: 0.6 } as const;
export const TRACER_LINGER = { min: 0.1, max: 0.8 } as const;
/** Each point moves with its own ease, so no two glide alike. */
export const TRACER_EASES = ['none', 'sine.inOut', 'power1.inOut', 'power2.inOut', 'power2.out', 'power3.out', 'power1.in', 'expo.inOut'] as const;

export interface TracerShape {
  cells: number;
  durationFactor: number;
  ease: (typeof TRACER_EASES)[number];
  delay: number;
  linger: number;
}

const within = (range: { min: number; max: number }, value: number) => range.min + value * (range.max - range.min);

/** A random ambient tracer: its length, speed, ease, start delay and linger, each within its range. */
export function tracerShape(random: () => number = Math.random): TracerShape {
  const cells = TRACER_CELLS.min + Math.floor(random() * (TRACER_CELLS.max - TRACER_CELLS.min + 1));
  const durationFactor = within(TRACER_DURATION, random());
  const ease = TRACER_EASES[Math.min(TRACER_EASES.length - 1, Math.floor(random() * TRACER_EASES.length))];
  const delay = within(TRACER_DELAY, random());
  const linger = within(TRACER_LINGER, random());
  return { cells: Math.min(cells, TRACER_CELLS.max), durationFactor, ease, delay, linger };
}
