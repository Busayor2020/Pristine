/**
 * The contract the media pipeline will implement.
 *
 * Types only. This package is framework-free by policy (enforced by a
 * `no-restricted-imports` rule in the root ESLint config): nothing from React,
 * the UI package, or any renderer may cross into it, so the pipeline can run
 * in a Web Worker, inside Capacitor, in a Node worker, or under test.
 *
 * Note what is absent. There is no `Preset` type carrying encoder parameters,
 * because no encoder parameter in this product has been measured yet. Preset
 * NAMES exist below (they are a product decision from the design), but the
 * values behind them arrive in stage 4, from `/experiments/results.md`.
 */

export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

/** How non-vertical source media is made to fill the Status frame. */
export type FitMode = 'fit' | 'crop';

/**
 * The three quality tiers the product exposes. A product-level naming
 * decision, not an encoder configuration. Nothing here implies we know what
 * parameters sit behind each name.
 */
export type PresetName = 'max' | 'balanced' | 'saver';

export interface SourceMedia {
  readonly kind: 'image' | 'video';
  readonly dimensions: Dimensions;
  /** Bytes. */
  readonly size: number;
  /** Seconds. Absent for stills. */
  readonly duration?: number;
}

export interface PreparedMedia {
  readonly dimensions: Dimensions;
  readonly size: number;
  readonly duration: number;
}

export type Stage = 'analysing' | 'reducing-noise' | 'matching-dimensions' | 'encoding';

export interface Progress {
  readonly stage: Stage;
  /** 0 to 1. */
  readonly value: number;
}

export interface PrepareOptions {
  readonly preset: PresetName;
  readonly fit: FitMode;
  readonly onProgress?: (progress: Progress) => void;
  readonly signal?: AbortSignal;
}

/** Implemented by the platform-specific backends. */
export interface Encoder {
  prepare(source: SourceMedia, options: PrepareOptions): Promise<PreparedMedia>;
}
