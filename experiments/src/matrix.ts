import type { CandidateParams, PostAs, Arm } from './manifest.js';

/**
 * Round 1 of the experiment.
 *
 * EVERY PARAMETER BELOW IS UNVERIFIED. Nothing here is a recommendation. They
 * are documented defaults chosen so that the arms differ from each other in
 * exactly one way, which is the only property that makes the results readable.
 *
 * Design constraint that shapes everything: a human has to post each candidate
 * to Status by hand and download what comes back. A 72 cell cartesian grid is
 * not an experiment, it is an afternoon nobody will finish. Nine arms is one
 * sitting, and nine arms chosen properly answer more than seventy chosen
 * lazily.
 *
 * Held constant in round 1, deliberately:
 *
 *   fps 25      Interacts with everything, so it is not a variable yet. 25 is
 *               the safest universally supported rate. A candidate for round 2.
 *   profile     high, the standard choice for H.264 at this resolution.
 *   pix_fmt     yuv420p. Not a choice: anything else fails to play on a large
 *               share of Android clients.
 *   preset      slow. Buys compression efficiency at the same CRF, and encode
 *               time does not matter in a harness.
 *
 * What each comparison answers:
 *
 *   02 against 01   Does pre-resizing to the Status frame help on its own?
 *                   This is the "biggest lever" claim, currently high
 *                   confidence and unmeasured.
 *   04 against 02   Does the video path beat the BEST photo path? This is the
 *                   central bet. 02, not 01, is the honest comparison: beating
 *                   the naive path while losing to a simple resize would mean
 *                   the product is a resize tool wearing a costume.
 *   03, 05 against 04   CRF sensitivity.
 *   06 against 04   Is tune stillimage worth anything?
 *   07, 08 against 04   Does clip duration change what survives?
 *   09 against 04   Does all intra coding survive better than a single
 *                   keyframe followed by predicted frames?
 */

export const HELD_CONSTANT = {
  fps: 25,
  profile: 'high',
  pixelFormat: 'yuv420p',
  preset: 'slow',
} as const;

/** The treatment baseline every video arm is a single deviation from. */
const BASE = { crf: 23, tune: 'stillimage', duration: 3, fps: HELD_CONSTANT.fps } as const;

export interface Arm2 {
  readonly id: string;
  readonly label: string;
  readonly arm: Arm;
  readonly postAs: PostAs;
  /** Whether the candidate is built from the original or the Status render. */
  readonly source: 'original' | 'reference';
  readonly params: CandidateParams;
}

export const MATRIX: readonly Arm2[] = [
  {
    id: '01',
    label: 'Control. The untouched photo, posted as a photo. What users do today.',
    arm: 'control',
    postAs: 'photo',
    source: 'original',
    params: { jpegQuality: 2 },
  },
  {
    id: '02',
    label: 'Control. Resized to the Status frame first, still posted as a photo.',
    arm: 'control',
    postAs: 'photo',
    source: 'reference',
    params: { jpegQuality: 2 },
  },
  {
    id: '03',
    label: 'Video, CRF 18. Higher quality than baseline.',
    arm: 'treatment',
    postAs: 'video',
    source: 'reference',
    params: { ...BASE, crf: 18 },
  },
  {
    id: '04',
    label: 'Video, CRF 23. The treatment baseline.',
    arm: 'treatment',
    postAs: 'video',
    source: 'reference',
    params: { ...BASE },
  },
  {
    id: '05',
    label: 'Video, CRF 28. Lower quality than baseline.',
    arm: 'treatment',
    postAs: 'video',
    source: 'reference',
    params: { ...BASE, crf: 28 },
  },
  {
    id: '06',
    label: 'Video, CRF 23, no tune. Isolates whether tune stillimage earns its place.',
    arm: 'treatment',
    postAs: 'video',
    source: 'reference',
    params: { crf: 23, duration: 3, fps: HELD_CONSTANT.fps },
  },
  {
    id: '07',
    label: 'Video, CRF 23, 1 second. Isolates clip duration.',
    arm: 'treatment',
    postAs: 'video',
    source: 'reference',
    params: { ...BASE, duration: 1 },
  },
  {
    id: '08',
    label: 'Video, CRF 23, 6 seconds. Isolates clip duration the other way.',
    arm: 'treatment',
    postAs: 'video',
    source: 'reference',
    params: { ...BASE, duration: 6 },
  },
  {
    id: '09',
    label: 'Video, CRF 23, every frame a keyframe. Isolates GOP structure.',
    arm: 'treatment',
    postAs: 'video',
    source: 'reference',
    params: { ...BASE, gop: 1 },
  },
];

/** Human readable one line summary of an arm's encoder settings. */
export function describeParams(params: CandidateParams): string {
  if (params.jpegQuality !== undefined) return `JPEG q${params.jpegQuality}`;
  const bits = [`CRF ${params.crf}`, `${params.duration}s`, `${params.fps}fps`];
  bits.push(params.tune === undefined ? 'no tune' : `tune ${params.tune}`);
  if (params.gop !== undefined) bits.push(`GOP ${params.gop}`);
  return bits.join(', ');
}
