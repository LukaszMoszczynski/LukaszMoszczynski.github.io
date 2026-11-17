/** Gsap-free data for the delivery loop, safe to import on the server. */

export type FactoryStage = 'label' | 'factory' | 'push' | 'review' | 'comments' | 'fix' | 'clean';

/** The six ring nodes, clockwise from the top. `clean` is the centre of the ring. */
export const FACTORY_NODES = ['label', 'factory', 'push', 'review', 'comments', 'fix'] as const satisfies readonly FactoryStage[];

/** Every stage in reading order, for the static diagram and the stage list. */
export const FACTORY_STAGES: readonly FactoryStage[] = [...FACTORY_NODES, 'clean'];

export const DEGREES_PER_NODE = 360 / FACTORY_NODES.length;

/**
 * One run of the loop: the label sends the task to the factory, it pushes,
 * the auto-reviewer reads it; each review cycle adds comments → fix → push →
 * review, and the run ends clean.
 */
export function factorySequence(reviewCycles: number): FactoryStage[] {
  const sequence: FactoryStage[] = ['label', 'factory', 'push', 'review'];
  for (let cycle = 0; cycle < reviewCycles; cycle++) sequence.push('comments', 'fix', 'push', 'review');
  sequence.push('clean');
  return sequence;
}

/** Ring angle in degrees (0 = top, clockwise) of a node. */
export function nodeAngle(stage: FactoryStage): number {
  return FACTORY_NODES.indexOf(stage as (typeof FACTORY_NODES)[number]) * DEGREES_PER_NODE;
}

/** Next cumulative rotation of the ticket: always clockwise, so fix → push goes on round the ring. */
export function nextRotation(current: number, stage: FactoryStage): number {
  const delta = (((nodeAngle(stage) - current) % 360) + 360) % 360;
  return current + delta;
}

/**
 * Geometry of the loop diagram, in viewBox units. One drawing (LoopDiagram.astro) serves the
 * interactive board on the case page and the compact, self-playing card visual, so both look alike.
 */
export const LOOP_WIDTH = 560;
export const LOOP_HEIGHT = 440;
export const LOOP_CENTER = { x: 280, y: 225 } as const;
export const LOOP_RADIUS = 130;
export const HUB_RADIUS = 46;
export const TICKET_SIZE = { width: 30, height: 20 } as const;

export interface LoopNode {
  stage: (typeof FACTORY_NODES)[number];
  x: number;
  y: number;
  /** Circle radius: the agent pipeline is the big station. */
  radius: number;
  /** Where its label goes, seen from the node. */
  side: 'top' | 'right' | 'bottom' | 'left';
}

const round = (value: number) => Math.round(value * 10) / 10;

/** The six stations round the ring, clockwise from the top. */
export function loopNodes(): LoopNode[] {
  return FACTORY_NODES.map((stage, index) => {
    const angle = (index * DEGREES_PER_NODE * Math.PI) / 180;
    const sine = Math.sin(angle);
    const side = sine > 0.3 ? 'right' : sine < -0.3 ? 'left' : Math.cos(angle) > 0 ? 'top' : 'bottom';
    return {
      stage,
      x: round(LOOP_CENTER.x + sine * LOOP_RADIUS),
      y: round(LOOP_CENTER.y - Math.cos(angle) * LOOP_RADIUS),
      radius: stage === 'factory' ? 17 : 12,
      side,
    };
  });
}
