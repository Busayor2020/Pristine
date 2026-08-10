/**
 * Writes results.md.
 *
 * The report has one job beyond printing numbers: it must not let a reader
 * walk away more confident than the data supports. So it states the verdict in
 * terms of the specific comparison that settles the bet, and it carries the
 * limitations inline rather than in a footnote nobody reads.
 */
import { describeParams } from './matrix.js';
import type { Manifest } from './manifest.js';
import type { CandidateResult } from './measure.js';

const mb = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const num = (value: number | undefined, digits: number): string =>
  value === undefined ? 'n/a' : Number.isFinite(value) ? value.toFixed(digits) : 'lossless';

/**
 * VMAF differences below about 1 point are not reliably visible and sit inside
 * run to run noise. Used to decide whether a verdict is a real separation or a
 * tie dressed up as a win.
 */
const VMAF_NOISE_FLOOR = 1;

export function buildReport(manifest: Manifest, results: readonly CandidateResult[]): string {
  const byId = new Map(results.map((r) => [r.id, r]));
  // Derived from the manifest, not from the results array. A candidate that was
  // never posted may have no result entry at all rather than one marked
  // missing, and a report that silently drops it would read as complete.
  const scored = manifest.candidates.filter((c) => byId.get(c.id)?.scores !== undefined);
  const missing = manifest.candidates.filter((c) => byId.get(c.id)?.scores === undefined);

  const bestPhotoControl = byId.get('02');
  const treatmentBaseline = byId.get('04');
  const naiveControl = byId.get('01');

  const lines: string[] = [];

  lines.push('# Experiment results');
  lines.push('');
  lines.push(
    `Fixture: \`${manifest.fixture.name}\` at ${manifest.fixture.width}x${manifest.fixture.height}`,
  );
  lines.push(
    `Reference: ${manifest.reference.width}x${manifest.reference.height}, ${manifest.reference.fit} mode`,
  );
  lines.push(`Generated: ${manifest.createdAt}`);
  lines.push(`Scored: ${scored.length} of ${manifest.candidates.length} arms`);
  lines.push('');

  if (manifest.fixture.synthetic) {
    lines.push('> **This run used a synthetic fixture.** Synthetic charts have exact ground');
    lines.push('> truth and are reproducible, but they carry no sensor noise and no real');
    lines.push('> scene statistics, and noise is a large part of what compression destroys.');
    lines.push('> Treat any result below as directional only. The bet is not settled until');
    lines.push('> this runs on real phone photographs.');
    lines.push('');
  }

  if (missing.length > 0) {
    lines.push(`> **Incomplete.** ${missing.length} arm(s) have no returned file yet:`);
    lines.push(`> ${missing.map((c) => c.id).join(', ')}. Numbers below are partial.`);
    lines.push('');
  }

  lines.push('## Verdict');
  lines.push('');
  lines.push(verdict(naiveControl, bestPhotoControl, treatmentBaseline));
  lines.push('');

  lines.push('## Scores');
  lines.push('');
  lines.push('Measured against the lossless Status render of the original fixture, not');
  lines.push('against what we uploaded. Higher is better on all three.');
  lines.push('');
  lines.push('| Arm | Post as | Settings | Sent | Returned | Size back | VMAF | SSIM | PSNR |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const candidate of manifest.candidates) {
    const result = byId.get(candidate.id);
    const dims =
      result?.returnedWidth === undefined
        ? 'n/a'
        : `${result.returnedWidth}x${result.returnedHeight}`;
    lines.push(
      `| ${candidate.id} | ${candidate.postAs} | ${describeParams(candidate.params)} | ` +
        `${mb(candidate.bytes)} | ${dims} | ` +
        `${result?.returnedBytes === undefined ? 'n/a' : mb(result.returnedBytes)} | ` +
        `${num(result?.scores?.vmaf, 2)} | ${num(result?.scores?.ssim, 4)} | ` +
        `${num(result?.scores?.psnr, 2)} |`,
    );
  }
  lines.push('');

  lines.push('## What each arm isolates');
  lines.push('');
  for (const candidate of manifest.candidates) {
    lines.push(`- **${candidate.id}** ${candidate.label}`);
  }
  lines.push('');

  lines.push('## What this does not tell us');
  lines.push('');
  lines.push('- **One device, one account, one moment.** WhatsApp changes its pipeline');
  lines.push('  without announcement, and behaviour may differ by Android version, by app');
  lines.push('  version and by region. A result here is a snapshot, not a constant.');
  lines.push('- **One fixture.** Detail, gradient, noise and chroma fail differently. A');
  lines.push('  parameter that wins on one can lose on another, so run every fixture');
  lines.push('  before drawing a conclusion about a preset.');
  lines.push('- **Metrics are proxies.** VMAF tracks human judgement better than SSIM or');
  lines.push('  PSNR, but none of them is an eye. A two point VMAF win that nobody can see');
  lines.push('  is not a product.');
  lines.push('- **Nothing about upload time or data cost.** Both matter to this audience as');
  lines.push('  much as quality does, and neither is measured here.');
  lines.push('');
  lines.push('Until an entry in this file supports it, no encoder parameter belongs in');
  lines.push('`packages/encoder` and no copy may assert a quality gain.');
  lines.push('');

  return lines.join('\n');
}

function verdict(
  naive: CandidateResult | undefined,
  photoControl: CandidateResult | undefined,
  treatment: CandidateResult | undefined,
): string {
  const naiveVmaf = naive?.scores?.vmaf;
  const controlVmaf = photoControl?.scores?.vmaf;
  const treatmentVmaf = treatment?.scores?.vmaf;

  if (controlVmaf === undefined || treatmentVmaf === undefined) {
    return (
      'Not yet determined. The verdict needs arm 02 (resized, posted as a photo) and\n' +
      'arm 04 (the video baseline) both scored. Post the missing candidates and run\n' +
      '`compare` again.'
    );
  }

  const delta = treatmentVmaf - controlVmaf;
  const lines: string[] = [];

  if (naiveVmaf !== undefined) {
    const resizeGain = controlVmaf - naiveVmaf;
    lines.push(
      `**Does resizing alone help?** ${resizeGain > VMAF_NOISE_FLOOR ? 'Yes' : 'Not measurably'}. ` +
        `Pre-resizing to the Status frame moved VMAF by ${resizeGain >= 0 ? '+' : ''}${resizeGain.toFixed(2)} ` +
        `(${naiveVmaf.toFixed(2)} to ${controlVmaf.toFixed(2)}).`,
    );
    lines.push('');
  }

  if (delta > VMAF_NOISE_FLOOR) {
    lines.push(
      `**The photo-as-video bet holds so far.** The video baseline scored ` +
        `${treatmentVmaf.toFixed(2)} against the best photo path at ${controlVmaf.toFixed(2)}, ` +
        `a gain of +${delta.toFixed(2)} VMAF. Confirm on the other fixtures before this ` +
        `changes any product decision.`,
    );
  } else if (delta < -VMAF_NOISE_FLOOR) {
    lines.push(
      `**The photo-as-video bet does not hold on this fixture.** The video baseline ` +
        `scored ${treatmentVmaf.toFixed(2)} against the best photo path at ` +
        `${controlVmaf.toFixed(2)}, a LOSS of ${delta.toFixed(2)} VMAF. If this repeats ` +
        `across fixtures, the central premise of the product is wrong and the honest ` +
        `move is a resize tool, not a photo-to-video tool.`,
    );
  } else {
    lines.push(
      `**Too close to call.** The video baseline scored ${treatmentVmaf.toFixed(2)} against ` +
        `the best photo path at ${controlVmaf.toFixed(2)}, a difference of ${delta.toFixed(2)} ` +
        `VMAF, which is inside the noise floor of ${VMAF_NOISE_FLOOR}. A gain nobody can see ` +
        `does not justify shipping a photo that comes back as a video.`,
    );
  }

  return lines.join('\n');
}
