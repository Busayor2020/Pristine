/**
 * Builds the candidate set for one fixture.
 *
 * Two steps. First render the fixture into the Status frame once, losslessly,
 * as the reference. Then derive every candidate from that reference, so the
 * only difference between arms is the parameter under test rather than an
 * accidental second resample.
 */
import fs from 'node:fs';
import path from 'node:path';
import { STATUS_FRAME, STATUS_MAX_BYTES, isUnderStatusLimit } from '@pristine/encoder';
import type { FitMode } from '@pristine/encoder';
import { probe, run } from './ffmpeg.js';
import { HELD_CONSTANT, MATRIX } from './matrix.js';
import type { Candidate, Manifest } from './manifest.js';
import { isSynthetic } from './fixtures.js';

const { width: W, height: H } = STATUS_FRAME;

/**
 * The filter chain that puts a source into the Status frame.
 *
 * lanczos rather than the default bicubic: this render is the yardstick every
 * score is measured against, so it should be the best downscale we can produce.
 * Any softness here would show up as apparent quality in every arm equally,
 * which is worse than useless.
 */
function statusRender(fit: FitMode): string {
  return fit === 'fit'
    ? `scale=${W}:${H}:force_original_aspect_ratio=decrease:flags=lanczos,` +
        `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`
    : `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H}`;
}

/** Renders the fixture into the Status frame as a lossless PNG. */
async function renderReference(fixture: string, out: string, fit: FitMode): Promise<void> {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await run([
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    fixture,
    '-vf',
    statusRender(fit),
    '-frames:v',
    '1',
    '-c:v',
    'png',
    out,
  ]);
}

async function encodePhoto(source: string, out: string, quality: number): Promise<void> {
  await run([
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    source,
    '-frames:v',
    '1',
    // -q:v 2 is the top of the usable mjpeg quality scale. Chosen so the photo
    // arms are not handicapped by our own encoder before WhatsApp sees them.
    '-q:v',
    String(quality),
    out,
  ]);
}

async function encodeVideo(
  source: string,
  out: string,
  params: { crf?: number; tune?: string; duration?: number; fps?: number; gop?: number },
): Promise<void> {
  const args = [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    // A still looped for the clip duration. -loop before -i applies to the
    // image demuxer, which is the only way to get a fixed length clip.
    '-loop',
    '1',
    '-i',
    source,
    '-t',
    String(params.duration ?? 3),
    '-r',
    String(params.fps ?? HELD_CONSTANT.fps),
    '-c:v',
    'libx264',
    '-preset',
    HELD_CONSTANT.preset,
    '-profile:v',
    HELD_CONSTANT.profile,
    '-pix_fmt',
    HELD_CONSTANT.pixelFormat,
    '-crf',
    String(params.crf ?? 23),
  ];
  if (params.tune !== undefined) args.push('-tune', params.tune);
  if (params.gop !== undefined) args.push('-g', String(params.gop));
  // faststart moves the index to the front. Without it some clients refuse to
  // preview the file, which would stall the manual posting step.
  args.push('-movflags', '+faststart', out);
  await run(args);
}

export interface GenerateOptions {
  readonly fixture: string;
  readonly outDir: string;
  readonly fit: FitMode;
}

export async function generate(options: GenerateOptions): Promise<Manifest> {
  const { fixture, outDir, fit } = options;
  if (!fs.existsSync(fixture)) throw new Error(`fixture not found: ${fixture}`);

  const fixtureInfo = await probe(fixture);
  if (fixtureInfo.width < W || fixtureInfo.height < H) {
    throw new Error(
      `fixture ${path.basename(fixture)} is ${fixtureInfo.width}x${fixtureInfo.height}, ` +
        `below the ${W}x${H} Status frame. The reference render would upscale, which ` +
        `invents detail and flatters every arm equally. Use a larger source.`,
    );
  }

  fs.mkdirSync(outDir, { recursive: true });
  const referenceFile = path.join(outDir, 'reference.png');
  await renderReference(fixture, referenceFile, fit);
  const referenceInfo = await probe(referenceFile);

  const candidates: Candidate[] = [];
  for (const arm of MATRIX) {
    const source = arm.source === 'original' ? fixture : referenceFile;
    const ext = arm.postAs === 'photo' ? 'jpg' : 'mp4';
    const name = `${arm.id}-${arm.postAs}-${arm.arm}.${ext}`;
    const file = path.join(outDir, name);

    if (arm.postAs === 'photo') {
      await encodePhoto(source, file, arm.params.jpegQuality ?? 2);
    } else {
      await encodeVideo(source, file, arm.params);
    }

    const bytes = fs.statSync(file).size;
    candidates.push({
      id: arm.id,
      label: arm.label,
      arm: arm.arm,
      postAs: arm.postAs,
      params: arm.params,
      file: path.relative(process.cwd(), file).split(path.sep).join('/'),
      bytes,
      underStatusLimit: isUnderStatusLimit(bytes),
    });
  }

  const oversized = candidates.filter((c) => !c.underStatusLimit);
  if (oversized.length > 0) {
    console.warn(
      `\n  WARNING: ${oversized.length} candidate(s) exceed the ${STATUS_MAX_BYTES} byte ` +
        `Status ceiling and will hit the aggressive compression path:\n` +
        oversized.map((c) => `    ${c.id} at ${(c.bytes / 1024 / 1024).toFixed(1)}MB`).join('\n'),
    );
  }

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    fixture: {
      name: path.basename(fixture, path.extname(fixture)),
      file: path.relative(process.cwd(), fixture).split(path.sep).join('/'),
      width: fixtureInfo.width,
      height: fixtureInfo.height,
      synthetic: isSynthetic(fixture),
    },
    reference: {
      file: path.relative(process.cwd(), referenceFile).split(path.sep).join('/'),
      width: referenceInfo.width,
      height: referenceInfo.height,
      fit,
    },
    candidates,
  };
}
