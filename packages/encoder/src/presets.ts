import type { Dimensions, FitMode, Preset, PresetName } from './types.js';

/** WhatsApp Status renders a 9:16 frame at 1080 by 1920. */
export const STATUS_FRAME: Dimensions = { width: 1080, height: 1920 };

/** Longest single Status post, in seconds. Anything over this has to be split. */
export const STATUS_MAX_DURATION = 30;

export const PRESETS: Readonly<Record<PresetName, Preset>> = {
  max: { name: 'max', output: STATUS_FRAME, bitrate: 5_600_000 },
  balanced: { name: 'balanced', output: STATUS_FRAME, bitrate: 2_500_000 },
  saver: { name: 'saver', output: STATUS_FRAME, bitrate: 1_200_000 },
};

/**
 * Places source media inside the Status frame.
 *
 * `fit` letterboxes: the whole image survives, bars fill the rest. `crop`
 * fills the frame and loses the overflow. Returns the drawn size, which the
 * caller centres.
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

/** How many Status posts a clip of `duration` seconds has to be cut into. */
export function partsRequired(duration: number, partLength = STATUS_MAX_DURATION): number {
  if (duration <= 0) return 0;
  if (partLength <= 0) throw new RangeError('partLength must be positive');
  return Math.ceil(duration / partLength);
}
