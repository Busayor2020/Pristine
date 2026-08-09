/**
 * The contract the media pipeline will implement.
 *
 * Types only. This package is framework-free by policy (enforced by a
 * `no-restricted-imports` rule in the root ESLint config): nothing from React,
 * the UI package, or any renderer may cross into it, so the pipeline can run
 * in a worker, in Node, or under test without a DOM.
 */

/** Target frame WhatsApp Status renders at. */
export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

/** How non-vertical source media is made to fill the Status frame. */
export type FitMode = 'fit' | 'crop';

/** The three quality presets the product exposes. */
export type PresetName = 'max' | 'balanced' | 'saver';

export interface Preset {
  readonly name: PresetName;
  /** Output frame. */
  readonly output: Dimensions;
  /** Target bitrate in bits per second. */
  readonly bitrate: number;
}

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
