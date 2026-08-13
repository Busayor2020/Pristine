import { STATUS_FRAME, fitToFrame } from './status.js';
import type { Dimensions, FitMode } from './types.js';

/**
 * Producing the Status render.
 *
 * This is the frame everything downstream is measured against: the encoder will
 * encode it, and the experiment scores against exactly this render of the
 * original. That is why it lives here rather than inside a component. A screen
 * that drew its own preview would be showing the user something the pipeline
 * never sees.
 *
 * It is a resize and nothing more. No encoder parameter, so it is not behind
 * the stage 4 gate.
 *
 * Framework-free by policy, so this takes a canvas rather than creating one and
 * never touches the DOM: the same code runs against an OffscreenCanvas in a
 * worker, which is where it belongs once the pipeline is real.
 */

/** Anything that can be drawn: a decoded bitmap, an image, a video frame. */
export type DrawableSource = CanvasImageSource & {
  readonly width: number;
  readonly height: number;
};

export interface RenderOptions {
  readonly fit: FitMode;
  readonly frame?: Dimensions;
  /**
   * Letterbox colour for `fit`. Passed in rather than imported, because
   * packages/encoder must not depend on the token package: the pipeline has to
   * run in a worker and in Node, where a stylesheet means nothing.
   */
  readonly backdrop: string;
}

export interface Renderable {
  readonly canvas: {
    width: number;
    height: number;
    getContext(id: '2d'): CanvasRenderingContext2D | null;
  };
}

/**
 * Draws a source into the Status frame.
 *
 * `fit` letterboxes, keeping the whole image and filling the rest with the
 * backdrop. `crop` fills the frame and loses the overflow. Both centre.
 *
 * Returns the drawn size, which is what the caller needs to describe the result
 * honestly: in fit mode the media occupies less than the frame.
 */
export function renderToStatusFrame(
  source: DrawableSource,
  target: Renderable['canvas'],
  options: RenderOptions,
): Dimensions {
  const frame = options.frame ?? STATUS_FRAME;
  const context = target.getContext('2d');
  if (context === null) throw new Error('could not get a 2d context for the Status render');

  target.width = frame.width;
  target.height = frame.height;

  const drawn = fitToFrame({ width: source.width, height: source.height }, options.fit, frame);
  const x = Math.round((frame.width - drawn.width) / 2);
  const y = Math.round((frame.height - drawn.height) / 2);

  // The backdrop is painted even in crop mode. Rounding can leave a subpixel
  // sliver at an edge, and a black hairline is less visible than a transparent
  // one that composites against whatever is behind the canvas.
  context.fillStyle = options.backdrop;
  context.fillRect(0, 0, frame.width, frame.height);

  // Browsers pick a resampling kernel here rather than exposing lanczos. High
  // quality is the closest available to the reference render the experiment
  // produces with ffmpeg, and the gap is a known, documented difference rather
  // than an accident.
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, x, y, drawn.width, drawn.height);

  return drawn;
}

/**
 * Whether the media is lying down.
 *
 * This is the question the entry screen actually asks, and the copy says so:
 * "This one is lying down. Status shows a tall frame. Pick how it should fill
 * it."
 *
 * Note that it is a narrower test than "would cropping lose anything". A 3:4
 * portrait photo is taller than it is wide but still wider than the 9:16 frame,
 * so cropping it does lose the sides. It does not get the card, because
 * "lying down" would be a lie and because `fit` is the right default there:
 * letterboxing keeps the whole photo, and a user who wanted it cropped can say
 * so in settings. Interrupting every ordinary upright photo with a question
 * would cost more than it saves.
 */
export function isLyingDown(source: Dimensions): boolean {
  if (source.width <= 0 || source.height <= 0) return false;
  return source.width > source.height;
}

/**
 * Whether cropping to the frame would discard part of the image.
 *
 * True for anything that is not already at least as tall as 9:16, including
 * ordinary portrait photos. Used to describe the result honestly, not to decide
 * whether to ask a question.
 */
export function cropWouldLoseContent(
  source: Dimensions,
  frame: Dimensions = STATUS_FRAME,
): boolean {
  if (source.width <= 0 || source.height <= 0) return false;
  return source.width / source.height > frame.width / frame.height;
}
