import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildIndex, readRuns, reportName, verdictFrom, type RunRecord } from './runs.js';
import type { Manifest } from './manifest.js';

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pristine-runs-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const manifest = (name: string, fit: 'fit' | 'crop' = 'fit'): Manifest =>
  ({
    version: 2,
    createdAt: '2026-08-10T00:00:00.000Z',
    conditions: { ffmpeg: '6.1.1' },
    fixture: { name, file: `fixtures/${name}.jpg`, width: 3000, height: 4000, provenance: 'phone' },
    reference: { file: 'candidates/reference.png', width: 1080, height: 1920, fit },
    candidates: [],
  }) as Manifest;

describe('reportName', () => {
  it('names a report by fixture and fit, so both can coexist', () => {
    expect(reportName(manifest('ankara'))).toBe('ankara-fit.md');
    expect(reportName(manifest('ankara', 'crop'))).toBe('ankara-crop.md');
  });

  /**
   * The fixture name comes from a filename on disk. Dots survive because they
   * are legal in a name; separators must not, or the report escapes results/.
   */
  it('does not let a fixture name escape into a path', () => {
    const name = reportName(manifest('../../etc/passwd'));
    expect(name).not.toContain('/');
    expect(name).not.toContain('\\');
    expect(path.basename(name)).toBe(name);
  });
});

describe('verdictFrom', () => {
  const report = (verdict: string) =>
    `# Experiment results\n\n## Verdict\n\n${verdict}\n\n## Scores\n`;

  it('picks the bet line, not the resize line that precedes it', () => {
    const text = report(
      '**Does resizing alone help?** Yes. Moved VMAF by +8.\n\n' +
        '**The photo-as-video bet holds so far.** A gain of +7.00 VMAF.',
    );
    expect(verdictFrom(text)).toMatch(/bet holds so far/);
    expect(verdictFrom(text)).not.toMatch(/resizing alone/);
  });

  it('reads a loss', () => {
    expect(
      verdictFrom(report('**The photo-as-video bet does not hold on this fixture.**')),
    ).toMatch(/does not hold/);
  });

  it('reads a tie', () => {
    expect(verdictFrom(report('**Too close to call.** Inside the noise floor.'))).toMatch(
      /Too close to call/,
    );
  });

  it('says unknown rather than guessing when there is no verdict section', () => {
    expect(verdictFrom('# Experiment results\n\nnothing here')).toBe('unknown');
  });

  /** The index is a table, and a full sentence wraps it into unreadability. */
  it('truncates a long verdict so the index stays a table', () => {
    const long = report(`**${'a'.repeat(200)}**`);
    expect(verdictFrom(long).length).toBeLessThanOrEqual(64);
    expect(verdictFrom(long)).toMatch(/\.\.\.$/);
  });
});

describe('buildIndex', () => {
  /**
   * The gate. Anyone opening results.md before a run exists has to be told the
   * gate is closed, not shown an empty table they might read as "no problems".
   */
  it('says plainly that the gate is closed when nothing is scored', () => {
    const index = buildIndex([]);
    expect(index).toContain('No run has been scored yet');
    expect(index).toContain('stage 4 gate is closed');
  });

  const run = (over: Partial<RunRecord> = {}): RunRecord => ({
    fixture: 'ankara',
    fit: 'fit',
    provenance: 'phone',
    scoredAt: '2026-08-10T12:00:00.000Z',
    verdict: 'The photo-as-video bet holds so far',
    file: 'ankara-fit.md',
    ...over,
  });

  it('lists a run and links to its report', () => {
    const index = buildIndex([run()]);
    expect(index).toContain('[ankara](results/ankara-fit.md)');
    expect(index).toContain('bet holds so far');
    expect(index).toContain('1 of them on a phone photo');
  });

  /**
   * A table full of synthetic runs still means the gate is closed, and the
   * index has to say so rather than looking like evidence.
   */
  it('warns when no run is decision grade', () => {
    const index = buildIndex([run({ provenance: 'synthetic' }), run({ provenance: 'camera' })]);
    expect(index).toContain('None of these is decision grade');
    expect(index).toContain('0 of them on a phone photo');
  });

  it('does not warn once a phone run exists', () => {
    const index = buildIndex([run({ provenance: 'synthetic' }), run()]);
    expect(index).not.toContain('None of these is decision grade');
  });
});

describe('readRuns', () => {
  it('reads what it needs back out of a written report', () => {
    const results = path.join(dir, 'results');
    fs.mkdirSync(results, { recursive: true });
    fs.writeFileSync(
      path.join(results, 'ankara-crop.md'),
      [
        '# Experiment results',
        '',
        'Fixture: `ankara` at 3000x4000',
        'Reference: 1080x1920, crop mode',
        'Source: phone (TECNO)',
        'Scored at: 2026-08-10T12:00:00.000Z',
        '',
        '## Verdict',
        '',
        '**Too close to call.** Inside the noise floor.',
        '',
        '## Scores',
      ].join('\n'),
    );

    expect(readRuns(dir)).toEqual([
      {
        fixture: 'ankara',
        fit: 'crop',
        provenance: 'phone',
        scoredAt: '2026-08-10T12:00:00.000Z',
        verdict: 'Too close to call',
        file: 'ankara-crop.md',
      },
    ]);
  });

  it('returns nothing before any run exists', () => {
    expect(readRuns(dir)).toEqual([]);
  });
});
