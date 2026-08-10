/**
 * The manifest is the contract between the two halves of the experiment.
 *
 * `generate` writes it. The human then posts each candidate to Status by hand
 * and drops what comes back into `returned/`. `compare` reads the manifest to
 * know what each returned file was, and what to score it against.
 *
 * It is written to disk rather than recomputed because the round trip happens
 * on a phone, hours later, possibly on a different machine. The parameters
 * that produced a candidate have to survive that gap or the numbers mean
 * nothing.
 */
import fs from 'node:fs';
import path from 'node:path';

/** The measurement arm a candidate belongs to. */
export type Arm = 'control' | 'treatment';

/** How the candidate is meant to be posted to WhatsApp Status. */
export type PostAs = 'photo' | 'video';

export interface CandidateParams {
  /** x264 constant rate factor. Absent for photo arms. */
  readonly crf?: number;
  /** x264 tune, for example stillimage. Absent means no tune flag. */
  readonly tune?: string;
  /** Clip length in seconds. Absent for photo arms. */
  readonly duration?: number;
  /** Frames per second. Absent for photo arms. */
  readonly fps?: number;
  /** Keyframe interval in frames. 1 means every frame is a keyframe. */
  readonly gop?: number;
  /** JPEG quality scale, 2 is best. Photo arms only. */
  readonly jpegQuality?: number;
}

export interface Candidate {
  /** Stable ordinal id. The human matches returned files by this prefix. */
  readonly id: string;
  /** What this arm isolates, in one line, for the report. */
  readonly label: string;
  readonly arm: Arm;
  readonly postAs: PostAs;
  readonly params: CandidateParams;
  /** Path relative to the experiments package root. */
  readonly file: string;
  readonly bytes: number;
  /** False if the file exceeds the Status size ceiling. */
  readonly underStatusLimit: boolean;
}

export interface Manifest {
  readonly version: 1;
  readonly createdAt: string;
  readonly fixture: {
    readonly name: string;
    readonly file: string;
    readonly width: number;
    readonly height: number;
    /**
     * Recorded rather than inferred later, because a result is only as good as
     * what it was measured on, and that fact has to survive to the report.
     */
    readonly provenance: 'synthetic' | 'phone' | 'camera' | 'unknown';
    /** EXIF Make, when there is one. */
    readonly make?: string;
  };
  /**
   * The fixture rendered into the Status frame losslessly. Every candidate is
   * derived from this, and every score is measured against it.
   */
  readonly reference: {
    readonly file: string;
    readonly width: number;
    readonly height: number;
    readonly fit: 'fit' | 'crop';
  };
  readonly candidates: readonly Candidate[];
}

export const MANIFEST_NAME = 'manifest.json';

export function writeManifest(dir: string, manifest: Manifest): string {
  const file = path.join(dir, MANIFEST_NAME);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return file;
}

export function readManifest(dir: string): Manifest {
  const file = path.join(dir, MANIFEST_NAME);
  if (!fs.existsSync(file)) {
    throw new Error(`no ${MANIFEST_NAME} in ${dir}. Run generate first.`);
  }
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest;
  if (parsed.version !== 1) throw new Error(`unsupported manifest version ${parsed.version}`);
  return parsed;
}

/**
 * Finds the file the human dropped back in for a candidate.
 *
 * Matching is on the id prefix alone, so it survives whatever WhatsApp and the
 * download flow do to the rest of the filename, which is unpredictable and
 * differs between Android and desktop.
 */
export function findReturnedFile(returnedDir: string, id: string): string | undefined {
  if (!fs.existsSync(returnedDir)) return undefined;
  const match = fs
    .readdirSync(returnedDir)
    .filter((name) => !name.startsWith('.'))
    .find((name) => name.startsWith(`${id}-`) || name.startsWith(`${id}.`));
  return match === undefined ? undefined : path.join(returnedDir, match);
}
