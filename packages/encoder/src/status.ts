import type { Dimensions, FitMode } from './types.js';

/**
 * Facts about the WhatsApp Status target, and the pure geometry that follows
 * from them.
 *
 * Nothing in this file is an encoder parameter. There are no bitrates, no CRF
 * values, no GOP sizes and no durations here, because none of those have been
 * measured yet. They arrive in stage 4, after `/experiments/results.md` exists,
 * and each will carry a citation to the measurement that justifies it.
 */

/**
 * The frame Status renders at.
 *
 * Matching this exactly is the single biggest lever we have: it avoids a
 * resample pass on the sender's device, which is where most of the visible
 * damage comes from. High confidence, unmeasured.
 */
export const STATUS_FRAME: Dimensions = { width: 1080, height: 1920 };

/**
 * Status media above roughly this size trips a more aggressive compression
 * path. Every candidate we produce has to land under it.
 *
 * 16MB as stated in the project brief. Treated as a hard ceiling rather than a
 * target, since the exact threshold is not something we have measured.
 */
export const STATUS_MAX_BYTES = 16 * 1024 * 1024;

/**
 * Places source media inside the Status frame.
 *
 * `fit` letterboxes: the whole image is kept, bars fill the rest. `crop` fills
 * the frame and loses the overflow. Returns the drawn size, which the caller
 * centres. Pure geometry, no encoder assumptions.
 */
export function fitToFrame(
  source: Dimensions,
  mode: FitMode,
  frame: Dimensions = STATUS_FRAME,
): Dimensions {
  if (source.width <= 0 || source.height <= 0) {
    throw new RangeError('source dimensions must be positive');
  }
  const scaleX = frame.width / source.width;
  const scaleY = frame.height / source.height;
  const scale = mode === 'fit' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
  return {
    width: Math.round(source.width * scale),
    height: Math.round(source.height * scale),
  };
}

/**
 * How many Status posts a clip of `duration` seconds has to be cut into.
 *
 * `partLength` is required rather than defaulted. The design mock showed 30s
 * and 60s options, but we have no citation for WhatsApp's actual per-post
 * ceiling, and burying an unverified 30 in a default parameter is exactly the
 * kind of confident wrong number this repo is trying to avoid. The caller has
 * to state what it believes and why.
 */
export function partsRequired(duration: number, partLength: number): number {
  if (duration <= 0) return 0;
  if (partLength <= 0) throw new RangeError('partLength must be positive');
  return Math.ceil(duration / partLength);
}

/** Whether a produced file is small enough to avoid the aggressive path. */
export function isUnderStatusLimit(bytes: number): boolean {
  return bytes > 0 && bytes <= STATUS_MAX_BYTES;
}
