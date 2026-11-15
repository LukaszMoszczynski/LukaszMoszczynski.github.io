/** GSAP-free deck maths: safe to import from tests and server code. */

export interface CardPose {
  x: 0;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

/** First card goes to the back; returns a new array. */
export function rotateDeck<T>(order: T[]): T[] {
  return order.length ? [...order.slice(1), order[0]] : [];
}

/** Resting pose of the card at `index` in a deck of `count` cards. */
export function cardPose(index: number, count: number): CardPose {
  return {
    x: 0,
    y: index * 16,
    scale: 1 - index * 0.05,
    rotation: index === 0 ? 0 : index % 2 ? -3 : 3,
    zIndex: count - index,
  };
}

/** A drag throws the card aside once it travels further than `threshold` px. */
export function shouldDismiss(deltaX: number, threshold = 110): boolean {
  return Math.abs(deltaX) > threshold;
}
