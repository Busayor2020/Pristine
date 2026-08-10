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

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.heic', '.tif', '.tiff']);

/** Every usable fixture currently sitting in the fixtures directory. */
export function listFixtures(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .sort();
}

/** True when the fixture came from `synthesise` rather than a real camera. */
export function isSynthetic(file: string): boolean {
  return SYNTHETIC_FIXTURES.some((f) => path.basename(file, path.extname(file)) === f.name);
}
