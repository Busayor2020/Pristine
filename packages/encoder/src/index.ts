/**
 * @pristine/encoder
 *
 * The media pipeline. Framework-free: no React, no DOM assumptions beyond what
 * a backend chooses to use internally, so it runs in a worker or under test.
 */
export type {
  Dimensions,
  Encoder,
  FitMode,
  PrepareOptions,
  PreparedMedia,
  Preset,
  PresetName,
  Progress,
  SourceMedia,
  Stage,
} from './types.js';

export {
  PRESETS,
  STATUS_FRAME,
  STATUS_MAX_DURATION,
  fitToFrame,
  partsRequired,
} from './presets.js';
