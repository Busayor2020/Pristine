/**
 * Thin wrapper over the ffmpeg binary.
 *
 * ffmpeg-static ships ffmpeg but not ffprobe, and pulling a second package in
 * just to read a width would not be worth the bytes. Stream details are parsed
 * out of what `ffmpeg -i` prints to stderr instead, which is stable enough for
 * a measurement harness that never ships.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

/** Absolute path to the bundled ffmpeg. */
export const FFMPEG: string = require('ffmpeg-static') as string;

export interface RunResult {
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * Runs ffmpeg. Rejects on a non-zero exit, with stderr attached, because a
 * silent encode failure that produces a zero-byte candidate would poison the
 * whole measurement.
 */
export async function run(args: readonly string[]): Promise<RunResult> {
  try {
    // ffmpeg writes its diagnostics to stderr even on success, so the buffer
    // has to be generous or a long filter graph truncates.
    const { stdout, stderr } = await execFileAsync(FFMPEG, [...args], {
      maxBuffer: 32 * 1024 * 1024,
    });
    return { stdout, stderr };
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    const detail = (err.stderr ?? err.message ?? 'unknown failure').trim();
    throw new Error(
      `ffmpeg failed\n  args: ${args.join(' ')}\n  ${detail.split('\n').slice(-6).join('\n  ')}`,
    );
  }
}

export interface MediaInfo {
  readonly width: number;
  readonly height: number;
  readonly codec: string;
  /** Seconds. Zero for a still. */
  readonly duration: number;
}

const STREAM = /Stream #\d+:\d+.*?: Video: (\w+).*?, (\d+)x(\d+)/;
const DURATION = /Duration: (\d+):(\d+):(\d+)\.(\d+)/;

/**
 * Reads dimensions, codec and duration from a media file.
 *
 * `ffmpeg -i` with no output exits non-zero by design ("At least one output
 * file must be specified"), so the stderr is read off the rejection rather
 * than treated as a failure.
 */
export async function probe(file: string): Promise<MediaInfo> {
  let text: string;
  try {
    const { stderr } = await execFileAsync(FFMPEG, ['-hide_banner', '-i', file], {
      maxBuffer: 8 * 1024 * 1024,
    });
    text = stderr;
  } catch (error) {
    text = (error as { stderr?: string }).stderr ?? '';
  }

  const stream = STREAM.exec(text);
  if (!stream) throw new Error(`could not read a video stream from ${file}`);

  const duration = DURATION.exec(text);
  const seconds = duration
    ? Number(duration[1]) * 3600 +
      Number(duration[2]) * 60 +
      Number(duration[3]) +
      Number(`0.${duration[4]}`)
    : 0;

  return {
    codec: stream[1] as string,
    width: Number(stream[2]),
    height: Number(stream[3]),
    // A still reports a nominal duration; treat anything under a frame as zero.
    duration: seconds < 0.05 ? 0 : seconds,
  };
}

export interface Capabilities {
  readonly version: string;
  readonly ssim: boolean;
  readonly psnr: boolean;
  readonly vmaf: boolean;
  readonly libx264: boolean;
}

/** What this ffmpeg build can actually do. Surfaced by the `doctor` command. */
export async function capabilities(): Promise<Capabilities> {
  const [{ stdout: versionOut }, { stdout: filters }, { stdout: encoders }] = await Promise.all([
    run(['-hide_banner', '-version']),
    run(['-hide_banner', '-filters']),
    run(['-hide_banner', '-encoders']),
  ]);

  const versionLine = versionOut.split('\n')[0] ?? '';
  const hasFilter = (name: string) => new RegExp(`\\b${name}\\b`).test(filters);

  return {
    version: versionLine.replace(/^ffmpeg version /, '').split(' ')[0] ?? 'unknown',
    ssim: hasFilter('ssim'),
    psnr: hasFilter('psnr'),
    vmaf: hasFilter('libvmaf'),
    libx264: /\blibx264\b/.test(encoders),
  };
}
