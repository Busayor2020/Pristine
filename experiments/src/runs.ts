/**
 * Where runs are kept.
 *
 * The first version of this harness wrote one `results.md` and overwrote it on
 * every `compare`. Scoring a second fixture destroyed the first, which is a
 * posting session thrown away for nothing.
 *
 * Now each run gets its own file under `results/`, and `results.md` becomes an
 * index. That path has to keep existing and keep meaning "the evidence",
 * because the stage 4 gate in `packages/encoder` and the protocol in the README
 * both point at it.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Manifest } from './manifest.js';

export const RESULTS_INDEX = 'results.md';
export const RESULTS_DIR = 'results';
export const RUNS_DIR = 'runs';

/** One scored run, as recorded in the index. */
export interface RunRecord {
  readonly fixture: string;
  readonly fit: string;
  readonly provenance: string;
  readonly scoredAt: string;
  /** The one line verdict, so the index answers the question on its own. */
  readonly verdict: string;
  readonly file: string;
}

/** Filename for a run's report. One per fixture and fit combination. */
export function reportName(manifest: Manifest): string {
  const safe = manifest.fixture.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${safe}-${manifest.reference.fit}.md`;
}

/**
 * Pulls the headline verdict out of a written report.
 *
 * Reads the file rather than being handed the value, so the index can be
 * rebuilt from whatever is on disk without re-scoring anything.
 */
export function verdictFrom(report: string): string {
  const section = /## Verdict\n\n([\s\S]*?)(?:\n## |$)/.exec(report);
  if (!section?.[1]) return 'unknown';

  // The bet line is the one that matters; the resize line comes first and is a
  // different question.
  const bold = [...section[1].matchAll(/\*\*(.+?)\*\*/g)].map((match) => match[1] as string);
  const bet = bold.find((line) => /bet|close to call|Not yet determined/i.test(line));
  const verdict = (bet ?? bold[0] ?? section[1].split('\n')[0] ?? 'unknown').replace(/\.$/, '');

  // The index is a table. A full sentence wraps it into unreadability, and the
  // report itself is one click away for anyone who wants the reasoning.
  return verdict.length > 64 ? `${verdict.slice(0, 61).trimEnd()}...` : verdict;
}

/** Every run currently on disk, newest first. */
export function readRuns(experimentsRoot: string): RunRecord[] {
  const dir = path.join(experimentsRoot, RESULTS_DIR);
  if (!fs.existsSync(dir)) return [];

  const runs: RunRecord[] = [];
  for (const name of fs.readdirSync(dir).filter((file) => file.endsWith('.md'))) {
    const report = fs.readFileSync(path.join(dir, name), 'utf8');
    const fixture = /^Fixture: `(.+?)`/m.exec(report)?.[1] ?? name.replace(/\.md$/, '');
    const fit = /, (fit|crop) mode/.exec(report)?.[1] ?? 'fit';
    const provenance = /^Source: (\S+)/m.exec(report)?.[1] ?? 'unknown';
    const scoredAt = /^Scored at: (.+)$/m.exec(report)?.[1] ?? '';
    runs.push({ fixture, fit, provenance, scoredAt, verdict: verdictFrom(report), file: name });
  }
  return runs.sort((a, b) => b.scoredAt.localeCompare(a.scoredAt));
}

/**
 * Rebuilds `results.md` as an index over `results/`.
 *
 * Deliberately short. Anyone opening it wants to know whether the bet holds and
 * on what, not to read every report.
 */
export function buildIndex(runs: readonly RunRecord[]): string {
  const lines = [
    '# Experiment results',
    '',
    'The evidence. This file is the index; each run has its own report under',
    '`results/`. Both are generated, so do not edit either by hand.',
    '',
  ];

  if (runs.length === 0) {
    lines.push('**No run has been scored yet.**');
    lines.push('');
    lines.push('The stage 4 gate is closed until at least one run appears here. No encoder');
    lines.push('parameter belongs in `packages/encoder` and no copy may assert a quality');
    lines.push('gain. See `experiments/README.md` for the protocol.');
    lines.push('');
    return lines.join('\n');
  }

  const decisionGrade = runs.filter((run) => run.provenance === 'phone');
  lines.push(`${runs.length} run(s) scored, ${decisionGrade.length} of them on a phone photo.`);
  lines.push('');

  if (decisionGrade.length === 0) {
    lines.push('> **None of these is decision grade.** Every run so far used a synthetic');
    lines.push('> chart, a dedicated camera, or a file with no camera EXIF. Each report');
    lines.push('> carries the caveat inline. The gate stays closed.');
    lines.push('');
  }

  lines.push('| Fixture | Fit | Source | Scored | Verdict |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const run of runs) {
    lines.push(
      `| [${run.fixture}](${RESULTS_DIR}/${run.file}) | ${run.fit} | ${run.provenance} | ` +
        `${run.scoredAt.slice(0, 10)} | ${run.verdict} |`,
    );
  }
  lines.push('');
  lines.push('A verdict only counts when the source is `phone`. Anything else is');
  lines.push('directional, and one fixture is never enough on its own: detail, gradient,');
  lines.push('noise and chroma fail differently.');
  lines.push('');

  return lines.join('\n');
}

/**
 * Moves a completed run out of the working directories.
 *
 * Lets the next fixture start from clean without destroying what came before.
 * Media is moved rather than copied, since it can be large and there is no
 * reason to keep two copies.
 */
export function archiveRun(experimentsRoot: string, manifest: Manifest): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safe = manifest.fixture.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const target = path.join(experimentsRoot, RUNS_DIR, `${stamp}-${safe}`);
  fs.mkdirSync(target, { recursive: true });

  for (const name of ['candidates', 'returned']) {
    const from = path.join(experimentsRoot, name);
    if (fs.existsSync(from)) fs.renameSync(from, path.join(target, name));
  }

  const report = path.join(experimentsRoot, RESULTS_DIR, reportName(manifest));
  if (fs.existsSync(report)) {
    fs.copyFileSync(report, path.join(target, reportName(manifest)));
  }

  return target;
}
