/**
 * Fixture sourcing.
 *
 * A fixture is the ORIGINAL image the whole experiment is measured against, so
 * it has to be at least Status resolution and as close to lossless as we can
 * get. Anything smaller means the reference render upscales, which invents
 * detail and quietly flatters every arm.
 *
 * The design export's four mock photographs are unusable here: they are all
 * 540x960 and already JPEG compressed, so they are half of Status resolution
 * and lossy before we start.
 *
 * Two sources are supported.
 *
 * REAL (preferred). Drop a phone photo into `fixtures/`. Straight off the
 * sensor, not screenshotted, not re-saved by a messaging app.
 *
 * SYNTHETIC (fallback, and what makes the harness runnable today). Generated
 * charts at 1440x2560, each stressing one named failure mode. They have exact
 * ground truth and are reproducible, which real photos are not, but they lack
 * sensor noise and real scene statistics. See the caveat in the generated
 * report: synthetic charts can show a direction, they cannot settle the bet.
 */
import fs from 'node:fs';
import path from 'node:path';
import { run } from './ffmpeg.js';

/** Deliberately above Status resolution, so the reference render downscales. */
export const FIXTURE_SIZE = { width: 1440, height: 2560 } as const;

export interface SyntheticFixture {
  readonly name: string;
  /** The failure mode this chart is designed to expose. */
  readonly stresses: string;
  /** lavfi source plus filter chain, minus the final format and scale. */
  readonly graph: string;
}

/**
 * Each chart isolates one thing compression is known to damage. Kept few and
 * legible rather than exhaustive: a chart nobody can interpret produces a
 * number nobody can act on.
 */
export const SYNTHETIC_FIXTURES: readonly SyntheticFixture[] = [
  {
    name: 'detail',
    stresses: 'High frequency detail. The first thing a low bitrate throws away.',
    // Dense concentric rings sweep spatial frequency across the whole frame.
    graph: `testsrc2=size=${FIXTURE_SIZE.width}x${FIXTURE_SIZE.height}:rate=1:duration=1`,
  },
  {
    name: 'gradient',
    stresses: 'Smooth gradients. Exposes banding from 8 bit quantisation.',
    graph: `gradients=size=${FIXTURE_SIZE.width}x${FIXTURE_SIZE.height}:rate=1:duration=1:c0=0x101820:c1=0xE8B33D:nb_colors=2`,
  },
  {
    name: 'noise',
    stresses: 'Sensor grain. Noise is expensive to encode and gets smeared.',
    graph: `color=c=0x3A3A3A:size=${FIXTURE_SIZE.width}x${FIXTURE_SIZE.height}:rate=1:duration=1,noise=alls=42:allf=t+u`,
  },
  {
    name: 'chroma',
    stresses: 'Saturated colour edges. 4:2:0 subsampling halves chroma resolution.',
    graph: `testsrc=size=${FIXTURE_SIZE.width}x${FIXTURE_SIZE.height}:rate=1:duration=1`,
  },
];

/** Writes one synthetic chart as a lossless PNG. */
export async function synthesise(fixture: SyntheticFixture, outFile: string): Promise<void> {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await run([
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    fixture.graph,
    '-frames:v',
    '1',
    // PNG so the fixture itself contributes no compression loss.
    '-c:v',
    'png',
    outFile,
  ]);
}

/**
 * What the bundled ffmpeg can actually decode. Verified against
 * `ffmpeg -decoders` rather than assumed, because a fixture that fails to
 * decode halfway through a run wastes the posting pass, not just the command.
 */
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.jp2', '.ppm']);

/**
 * Formats a phone might hand over that this build cannot read.
 *
 * ffmpeg-static ships without libheif and without libjxl, so HEIC (the iPhone
 * default) and JPEG XL both fail. Raw is out too: no libraw. These are named
 * explicitly so the error tells the user what to do instead of "no fixtures".
 */
const UNDECODABLE_EXT = new Set([
  '.heic',
  '.heif',
  '.avif',
  '.jxl',
  '.dng',
  '.raw',
  '.cr2',
  '.nef',
]);

/** Every usable fixture currently sitting in the fixtures directory. */
export function listFixtures(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .sort();
}

/**
 * Explains why a file in fixtures/ was ignored, when the reason is the format
 * rather than the file being absent.
 */
export function undecodableReason(file: string): string | undefined {
  const ext = path.extname(file).toLowerCase();
  if (!UNDECODABLE_EXT.has(ext)) return undefined;
  return (
    `${ext} cannot be decoded by the bundled ffmpeg (no libheif, no libjxl, no libraw). ` +
    `Convert it to PNG or JPEG at full resolution first, on the phone or with a tool ` +
    `that does not downscale.`
  );
}

/** Files sitting in fixtures/ that were skipped because of their format. */
export function listUndecodable(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => UNDECODABLE_EXT.has(path.extname(name).toLowerCase()))
    .sort();
}

/** True when the fixture came from `synthesise` rather than a real camera. */
export function isSynthetic(file: string): boolean {
  return SYNTHETIC_FIXTURES.some((f) => path.basename(file, path.extname(file)) === f.name);
}

/**
 * Where a fixture came from, as far as we can tell.
 *
 *   synthetic  one of our generated charts
 *   phone      EXIF names a phone maker. The target device, and the only
 *              provenance that produces a decision-grade result
 *   camera     EXIF names a dedicated camera. Real sensor output, but a much
 *              cleaner sensor than anything this audience shoots on
 *   unknown    no camera metadata: stock, a screenshot, an export, or a file
 *              already through a processing pipeline
 */
export type Provenance = 'synthetic' | 'phone' | 'camera' | 'unknown';

/**
 * Phone makers, as they appear in EXIF `Make`.
 *
 * Weighted towards what this product's users actually carry rather than
 * towards what a photography forum would list.
 */
const PHONE_MAKERS = [
  'Apple',
  'samsung',
  'Samsung',
  'Xiaomi',
  'Redmi',
  'OPPO',
  'vivo',
  'realme',
  'HUAWEI',
  'HONOR',
  'TECNO',
  'Infinix',
  'itel',
  'Google',
  'OnePlus',
  'motorola',
  'Nokia',
];

/**
 * Dedicated cameras.
 *
 * Kept separate because a full frame sensor is not the device under test. Its
 * noise floor is far below a mid-range phone's, so it flatters every arm
 * equally and understates exactly the damage this experiment is trying to
 * measure.
 */
const CAMERA_MAKERS = ['Canon', 'NIKON', 'Nikon', 'SONY', 'FUJIFILM', 'PENTAX', 'OLYMPUS', 'Leica'];

/**
 * Reads provenance from the file head.
 *
 * A heuristic, not a guarantee: EXIF can be stripped from a real photo, and it
 * can be forged. It exists to catch the common and costly mistake of measuring
 * stock imagery, which is already denoised and sharpened and therefore answers
 * a different question than the one this experiment asks.
 */
export function readProvenance(file: string): { provenance: Provenance; make?: string } {
  if (isSynthetic(file)) return { provenance: 'synthetic' };

  // EXIF lives in the first APP1 segment, well inside the first 128KB.
  const head = Buffer.alloc(128 * 1024);
  const handle = fs.openSync(file, 'r');
  let read = 0;
  try {
    read = fs.readSync(handle, head, 0, head.length, 0);
  } finally {
    fs.closeSync(handle);
  }

  const text = head.subarray(0, read).toString('latin1');
  if (!text.includes('Exif\0\0')) return { provenance: 'unknown' };

  const phone = PHONE_MAKERS.find((maker) => text.includes(maker));
  if (phone !== undefined) return { provenance: 'phone', make: phone };

  const camera = CAMERA_MAKERS.find((maker) => text.includes(maker));
  if (camera !== undefined) return { provenance: 'camera', make: camera };

  return { provenance: 'unknown' };
}
