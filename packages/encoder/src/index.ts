/**
 * @pristine/encoder
 *
 * The media pipeline. Framework-free: no React, no DOM assumptions beyond what
 * a backend chooses internally, so it runs in a Web Worker, inside Capacitor,
 * or in Node under test.
 *
 * Stage 4 work (the actual encode paths, WebCodecs primary with ffmpeg.wasm as
 * fallback) is not started, and must not start until `/experiments/results.md`
 * exists. What ships today is the type contract plus the Status facts and the
 * pure geometry that follows from them.
 */
export type {
  Dimensions,
  Encoder,
  FitMode,
  PrepareOptions,
  PreparedMedia,
  PresetName,
  Progress,
  SourceMedia,
  Stage,
} from './types.js';

export {
  STATUS_FRAME,
  STATUS_MAX_BYTES,
  fitToFrame,
  isUnderStatusLimit,
  partsRequired,
} from './status.js';

export { ASSUMED_UPLOAD_BPS, estimateUploadSeconds } from './estimate.js';
