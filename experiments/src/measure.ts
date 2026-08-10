/**
 * Scoring.
 *
 * Everything is normalised to a single lossless PNG frame at the Status frame
 * size before any metric runs. That matters more than it looks:
 *
 *   - SSIM, PSNR and libvmaf all require both inputs to match in resolution
 *     and frame count. A returned video and a reference still match on
 *     neither.
 *   - WhatsApp may hand back something at a different size than we sent. Left
 *     alone that would be scored as catastrophic damage rather than as a
 *     resize, which is a different finding.
 *
 * So both sides become one PNG at 1080x1920 and the comparison is honest.
 *
 * The reference is always the lossless Status render of the ORIGINAL fixture,
 * never what we sent. Scoring against what we sent would measure only
 * WhatsApp's contribution and would happily award a perfect score to a
 * pipeline that destroyed the photo before upload.
 */
import fs from 'node:fs';
import path from 'node:path';
import { STATUS_FRAME } from '@pristine/encoder';
import { probe, run } from './ffmpeg.js';

const { width: W, height: H } = STATUS_FRAME;

export interface Scores {
  /** Structural similarity, 0 to 1. Higher is better. */
  readonly ssim: number;
  /** Peak signal to noise ratio in dB. Higher is better. Infinity if identical. */
  readonly psnr: number;
  /** Netflix VMAF, 0 to 100. Higher is better. Correlates best with perception. */
  readonly vmaf: number;
}

/**
 * Extracts one comparable frame.
 *
 * For a clip the frame is taken from the midpoint rather than the start. The
 * first frame is the keyframe and is the best looking frame in the file, so
 * scoring it would systematically overstate every video arm.
 */
export async function toComparableFrame(input: string, out: string): Promise<void> {
  const info = await probe(input);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const args = ['-y', '-hide_banner', '-loglevel', 'error'];
  if (info.duration > 0) args.push('-ss', (info.duration / 2).toFixed(3));
  args.push('-i', input);
  args.push(
    '-vf',
    // Only resizes when WhatsApp changed the size. Lanczos again so the
    // normalisation step is not itself a source of loss.
    `scale=${W}:${H}:flags=lanczos`,
    '-frames:v',
    '1',
    '-c:v',
    'png',
    out,
  );
  await run(args);
}

const parse = (text: string, pattern: RegExp): number => {
  const match = pattern.exec(text);
  if (!match?.[1]) throw new Error(`could not parse a score from ffmpeg output`);
  const value = match[1];
  return value === 'inf' ? Number.POSITIVE_INFINITY : Number(value);
};

/**
 * Runs one metric filter over a distorted and reference pair.
 * Input order matters: ffmpeg treats the first input as the distorted one.
 */
async function metric(distorted: string, reference: string, filter: string): Promise<string> {
  const { stderr } = await run([
    '-hide_banner',
    '-i',
    distorted,
    '-i',
    reference,
    '-lavfi',
    filter,
    '-f',
    'null',
    '-',
  ]);
  return stderr;
}

export async function score(distortedPng: string, referencePng: string): Promise<Scores> {
  const [ssimOut, psnrOut, vmafOut] = await Promise.all([
    metric(distortedPng, referencePng, 'ssim'),
    metric(distortedPng, referencePng, 'psnr'),
    metric(distortedPng, referencePng, 'libvmaf'),
  ]);

  return {
    ssim: parse(ssimOut, /SSIM .*?All:([\d.]+|inf)/),
    psnr: parse(psnrOut, /PSNR .*?average:([\d.]+|inf)/),
    vmaf: parse(vmafOut, /VMAF score: ([\d.]+|inf)/),
  };
}

export interface CandidateResult {
  readonly id: string;
  readonly scores?: Scores;
  /** Size of the file WhatsApp handed back, in bytes. */
  readonly returnedBytes?: number;
  readonly returnedWidth?: number;
  readonly returnedHeight?: number;
  /** Set when the candidate was never posted or the return leg is missing. */
  readonly missing?: string;
}

/** Scores one returned file against the reference render. */
export async function measureReturned(
  id: string,
  returnedFile: string,
  referencePng: string,
  workDir: string,
): Promise<CandidateResult> {
  const info = await probe(returnedFile);
  const framePng = path.join(workDir, `${id}-returned.png`);
  await toComparableFrame(returnedFile, framePng);
  const scores = await score(framePng, referencePng);
  return {
    id,
    scores,
    returnedBytes: fs.statSync(returnedFile).size,
    returnedWidth: info.width,
    returnedHeight: info.height,
  };
}
