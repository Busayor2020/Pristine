/**
 * Where a long clip gets cut.
 *
 * Pure, and separate from the component, because getting this wrong produces
 * parts that overlap or a part of zero length, and neither is visible from a
 * screenshot.
 */

/**
 * Minimum share of the clip a part must occupy.
 *
 * Stops a cut being dragged onto its neighbour and producing a part too short
 * to be worth posting, and keeps both handles grabbable.
 */
export const MIN_PART_FRACTION = 0.08;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Moves one cut, keeping it clear of its neighbours and of both ends.
 *
 * Cuts stay sorted: a drag can push a handle up to its neighbour's edge but
 * never past it, so the parts never reorder under the user's thumb.
 */
export function moveCut(cuts: readonly number[], index: number, position: number): number[] {
  if (index < 0 || index >= cuts.length) throw new RangeError('no such cut');

  const lower = index === 0 ? 0 : (cuts[index - 1] as number);
  const upper = index === cuts.length - 1 ? 1 : (cuts[index + 1] as number);

  const next = [...cuts];
  next[index] = clamp(position, lower + MIN_PART_FRACTION, upper - MIN_PART_FRACTION);
  return next;
}

/** The index of the cut nearest a position, for deciding what a drag grabbed. */
export function nearestCut(cuts: readonly number[], position: number): number {
  let best = 0;
  let bestDistance = Infinity;
  cuts.forEach((cut, index) => {
    const distance = Math.abs(cut - position);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}

export interface Part {
  readonly index: number;
  /** Start and end as a share of the whole clip. */
  readonly from: number;
  readonly to: number;
  readonly seconds: number;
}

/** The parts that a set of cuts divides a clip into. */
export function partsFromCuts(cuts: readonly number[], durationSeconds: number): Part[] {
  const bounds = [0, ...cuts, 1];
  const parts: Part[] = [];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const from = bounds[i] as number;
    const to = bounds[i + 1] as number;
    parts.push({ index: i, from, to, seconds: (to - from) * durationSeconds });
  }
  return parts;
}

/**
 * Evenly spaced cuts for a target part length.
 *
 * Used when the user switches between 30s and 60s parts, which should re-cut
 * the clip rather than keep marks that no longer make sense.
 */
export function evenCuts(durationSeconds: number, partSeconds: number): number[] {
  if (partSeconds <= 0) throw new RangeError('partSeconds must be positive');
  const count = Math.ceil(durationSeconds / partSeconds);
  const cuts: number[] = [];
  for (let i = 1; i < count; i += 1) cuts.push((i * partSeconds) / durationSeconds);
  return cuts;
}
