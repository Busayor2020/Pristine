/**
 * The before and after comparison maths.
 *
 * Pure and separate from the component because this is the interaction the
 * product is sold on. It gets real coverage, and it should be readable without
 * a browser in the way.
 */

/** How far the pointer must travel before a press counts as a drag, in px. */
export const DRAG_THRESHOLD = 4;

/**
 * The handle never reaches the edge.
 *
 * At 0 or 100 one side vanishes completely and the control reads as broken
 * rather than as fully swept, and there is nothing left to grab.
 */
export const MIN_POSITION = 2;
export const MAX_POSITION = 98;

/** Where a tap sends the handle, so a single tap always crosses the middle. */
export const FLIP_NEAR = 4;
export const FLIP_FAR = 96;

export interface Bounds {
  readonly left: number;
  readonly width: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Handle position as a percentage, from a pointer x and the element's box.
 *
 * A zero width box would divide by zero during a resize or an unmounted
 * measurement, so it parks the handle in the middle rather than producing NaN
 * and blanking the image.
 */
export function positionFromPointer(clientX: number, bounds: Bounds): number {
  if (bounds.width <= 0) return 50;
  const ratio = (clientX - bounds.left) / bounds.width;
  return clamp(ratio * 100, MIN_POSITION, MAX_POSITION);
}

/** Whether the pointer has moved far enough to be a drag rather than a tap. */
export function hasDragged(startX: number, currentX: number): boolean {
  return Math.abs(currentX - startX) > DRAG_THRESHOLD;
}

/**
 * Where a tap should send the handle.
 *
 * Always to the opposite side, so repeated tapping flips between the two
 * images instead of creeping toward one edge.
 */
export function flipTarget(current: number): number {
  return current > 50 ? FLIP_NEAR : FLIP_FAR;
}

/**
 * The clip rectangle that reveals the "after" image.
 *
 * Insets from the left by the handle position, so the after image occupies
 * everything to the right of the handle.
 */
export function clipInset(position: number): string {
  return `inset(0 0 0 ${clamp(position, 0, 100)}%)`;
}
