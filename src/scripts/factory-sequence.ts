/** Gsap-free data for the dark-factory loop, safe to import on the server. */

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
