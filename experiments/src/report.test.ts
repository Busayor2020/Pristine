import { describe, expect, it } from 'vitest';
import { buildReport } from './report.js';
import { MATRIX } from './matrix.js';
import type { Manifest } from './manifest.js';
import type { CandidateResult } from './measure.js';

const manifest: Manifest = {
  version: 2,
  createdAt: '2026-08-10T00:00:00.000Z',
  conditions: {
    ffmpeg: '6.1.1-essentials_build-www.gyan.dev',
    device: 'TECNO Spark 10 Pro',
    os: 'Android 13',
    whatsapp: '2.24.1.1',
  },
  fixture: {
    name: 'sample',
    file: 'fixtures/sample.png',
    width: 1440,
    height: 2560,
    provenance: 'camera',
    make: 'TECNO',
  },
  reference: { file: 'candidates/reference.png', width: 1080, height: 1920, fit: 'fit' },
  candidates: MATRIX.map((arm) => ({
    id: arm.id,
    label: arm.label,
    arm: arm.arm,
    postAs: arm.postAs,
    params: arm.params,
    file: `candidates/${arm.id}.bin`,
    bytes: 1_000_000,
    underStatusLimit: true,
  })),
};

const result = (id: string, vmaf: number): CandidateResult => ({
  id,
  scores: { vmaf, ssim: 0.9, psnr: 30 },
  returnedBytes: 500_000,
  returnedWidth: 1080,
  returnedHeight: 1920,
});

describe('verdict', () => {
  it('declares the bet holding when the video baseline clears the photo control', () => {
    const report = buildReport(manifest, [result('01', 70), result('02', 75), result('04', 82)]);
    expect(report).toContain('bet holds so far');
    expect(report).toContain('+7.00 VMAF');
  });

  /**
   * The failure case has to be stated as plainly as the success case, or the
   * report becomes a way of not noticing bad news.
   */
  it('declares the bet failing when the video baseline loses to the photo control', () => {
    const report = buildReport(manifest, [result('01', 70), result('02', 82), result('04', 75)]);
    expect(report).toContain('does not hold');
    expect(report).toContain('resize tool, not a photo-to-video tool');
  });

  it('calls a difference inside the noise floor a tie rather than a win', () => {
    const report = buildReport(manifest, [result('01', 70), result('02', 80), result('04', 80.6)]);
    expect(report).toContain('Too close to call');
    expect(report).not.toContain('bet holds');
  });

  it('reports the resize lever separately from the video bet', () => {
    const report = buildReport(manifest, [result('01', 70), result('02', 78), result('04', 85)]);
    expect(report).toContain('Does resizing alone help?');
    expect(report).toContain('+8.00');
  });

  it('says resizing did not measurably help when the gain is inside the noise', () => {
    const report = buildReport(manifest, [result('01', 78), result('02', 78.4), result('04', 85)]);
    expect(report).toMatch(/Does resizing alone help\?\*\* Not measurably/);
  });

  it('refuses a verdict when the two decisive arms are not both scored', () => {
    const report = buildReport(manifest, [result('01', 70), result('02', 75)]);
    expect(report).toContain('Not yet determined');
  });
});

describe('report body', () => {
  it('flags a partial run', () => {
    const report = buildReport(manifest, [result('02', 75), result('04', 82)]);
    expect(report).toContain('Incomplete');
  });

  it('warns loudly when the fixture is synthetic', () => {
    const synthetic: Manifest = {
      ...manifest,
      fixture: { ...manifest.fixture, provenance: 'synthetic' },
    };
    const report = buildReport(synthetic, [result('02', 75), result('04', 82)]);
    expect(report).toContain('synthetic fixture');
    expect(report).toContain('directional only');
  });

  /**
   * The dangerous case. Stock imagery is not synthetic, so without this it
   * would produce a report that reads as a real result while measuring an
   * already denoised and sharpened image.
   */
  it('warns when the fixture carries no camera EXIF', () => {
    const stock: Manifest = {
      ...manifest,
      fixture: { ...manifest.fixture, provenance: 'unknown', make: undefined },
    };
    const report = buildReport(stock, [result('02', 75), result('04', 82)]);
    expect(report).toContain('no camera EXIF');
    expect(report).toContain('directional only');
  });

  it('does not caveat a real camera fixture, and names the maker', () => {
    const report = buildReport(manifest, [result('02', 75), result('04', 82)]);
    expect(report).not.toContain('synthetic fixture');
    expect(report).not.toContain('no camera EXIF');
    expect(report).toContain('camera (TECNO)');
  });

  it('carries the limitations and the gate on stage 4', () => {
    const report = buildReport(manifest, [result('02', 75), result('04', 82)]);
    expect(report).toContain('What this does not tell us');
    expect(report).toContain('no encoder parameter belongs in');
  });

  it('lists every arm with the comparison it isolates', () => {
    const report = buildReport(manifest, [result('02', 75), result('04', 82)]);
    for (const arm of MATRIX) expect(report).toContain(`**${arm.id}**`);
  });

  it('marks unscored arms as not available rather than as zero', () => {
    const report = buildReport(manifest, [result('02', 75), result('04', 82)]);
    expect(report).toMatch(/\| n\/a \|/);
    expect(report).not.toMatch(/\| 0\.00 \|/);
  });
});
