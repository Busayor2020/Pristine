/**
 * Measurement harness for the photo-as-video hypothesis.
 *
 * Never shipped, never imported by an app. The whole point of this package is
 * to produce `results.md`, which is the gate on stage 4 and on every quality
 * claim in the copy.
 *
 * The round trip cannot be automated. WhatsApp compresses on the sender's
 * device before upload, so there is no endpoint to call and no way to observe
 * the pipeline except by posting to Status by hand and downloading what comes
 * back. The harness owns the two ends and the human owns the middle.
 *
 *   doctor                  check this ffmpeg can do the job
 *   synth                   write the synthetic fixtures
 *   generate <fixture>      build candidates plus manifest
 *   status                  what has been posted back so far
 *   compare                 score the returns and write results.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FitMode } from '@pristine/encoder';
import { capabilities } from './ffmpeg.js';
import {
  SYNTHETIC_FIXTURES,
  listFixtures,
  listUndecodable,
  synthesise,
  undecodableReason,
} from './fixtures.js';
import { generate } from './generate.js';
import {
  findReturnedFile,
  readConditions,
  readManifest,
  unscoredArms,
  writeManifest,
  type Manifest,
} from './manifest.js';
import { measureReturned, type CandidateResult } from './measure.js';
import { buildReport } from './report.js';
import {
  RESULTS_DIR,
  RESULTS_INDEX,
  archiveRun,
  buildIndex,
  readRuns,
  reportName,
} from './runs.js';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const DIRS = {
  fixtures: path.join(ROOT, 'fixtures'),
  candidates: path.join(ROOT, 'candidates'),
  returned: path.join(ROOT, 'returned'),
  work: path.join(ROOT, 'candidates', '.work'),
  resultsDir: path.join(ROOT, RESULTS_DIR),
  index: path.join(ROOT, RESULTS_INDEX),
};

/** Rewrites results.md from whatever reports are on disk. */
function refreshIndex(): void {
  fs.writeFileSync(DIRS.index, buildIndex(readRuns(ROOT)), 'utf8');
}

type Command = (args: readonly string[]) => Promise<void>;

const commands: Record<string, Command> = {
  async doctor() {
    const caps = await capabilities();
    console.log(`ffmpeg ${caps.version}`);
    const rows: [string, boolean, string][] = [
      ['libx264', caps.libx264, 'required to build video candidates'],
      ['ssim', caps.ssim, 'required'],
      ['psnr', caps.psnr, 'required'],
      ['libvmaf', caps.vmaf, 'required, and the metric that matters most'],
    ];
    for (const [name, ok, note] of rows) {
      console.log(`  ${ok ? 'ok  ' : 'MISS'}  ${name.padEnd(9)} ${note}`);
    }
    const missing = rows.filter(([, ok]) => !ok);
    if (missing.length > 0) {
      console.error(`\n${missing.length} capability missing. The harness cannot run.`);
      process.exitCode = 1;
      return;
    }
    console.log('\nAll required capabilities present.');
  },

  async synth() {
    fs.mkdirSync(DIRS.fixtures, { recursive: true });
    for (const fixture of SYNTHETIC_FIXTURES) {
      const out = path.join(DIRS.fixtures, `${fixture.name}.png`);
      await synthesise(fixture, out);
      console.log(`${fixture.name.padEnd(9)} ${fixture.stresses}`);
    }
    console.log(`\nWrote ${SYNTHETIC_FIXTURES.length} charts to fixtures/.`);
    console.log('These are a fallback. Real phone photographs give a real answer.');
  },

  async generate(args) {
    const name = args[0];
    if (name === undefined) {
      const available = listFixtures(DIRS.fixtures);
      console.error('usage: generate <fixture> [fit|crop]');
      console.error(
        available.length > 0
          ? `available: ${available.join(', ')}`
          : 'no fixtures yet. Run `synth`, or drop a phone photo into fixtures/.',
      );
      // A HEIC sitting in fixtures/ looks like a fixture to everyone except
      // ffmpeg. Say so, rather than reporting an empty directory.
      for (const skipped of listUndecodable(DIRS.fixtures)) {
        console.error(`\nskipped ${skipped}: ${undecodableReason(skipped)}`);
      }
      process.exitCode = 1;
      return;
    }

    const unreadable = undecodableReason(name);
    if (unreadable !== undefined) {
      console.error(unreadable);
      process.exitCode = 1;
      return;
    }

    const force = args.includes('--force');
    const positional = args.filter((arg) => !arg.startsWith('--'));
    const fit = (positional[1] ?? 'fit') as FitMode;
    if (fit !== 'fit' && fit !== 'crop') throw new TypeError('fit must be "fit" or "crop"');

    // Refuse to throw away a posting session. Getting nine files through Status
    // by hand is the expensive part of this experiment, and silently
    // overwriting candidates/ while returned/ still holds unscored files
    // destroys exactly that.
    if (!force && fs.existsSync(path.join(DIRS.candidates, 'manifest.json'))) {
      const previous = readManifest(DIRS.candidates);
      const pending = unscoredArms(previous, DIRS.returned);
      if (pending.length > 0) {
        console.error(
          `\nThere is an unscored run in progress for "${previous.fixture.name}".\n` +
            `${pending.length} arm(s) have come back and have not been scored: ${pending.join(', ')}.\n\n` +
            `Score it first:      pnpm exp compare\n` +
            `Then put it away:    pnpm exp archive\n` +
            `Or discard it:       pnpm exp generate ${positional[0] ?? '<fixture>'} --force\n`,
        );
        process.exitCode = 1;
        return;
      }
    }

    const fixture = path.isAbsolute(name) ? name : path.join(DIRS.fixtures, name);
    const resolved = fs.existsSync(fixture) ? fixture : `${fixture}.png`;

    const manifest = await generate({
      fixture: resolved,
      outDir: DIRS.candidates,
      fit,
      experimentsRoot: ROOT,
    });
    writeManifest(DIRS.candidates, manifest);

    console.log(`\nBuilt ${manifest.candidates.length} candidates in candidates/\n`);
    for (const candidate of manifest.candidates) {
      const size = (candidate.bytes / 1024 / 1024).toFixed(2);
      const flag = candidate.underStatusLimit ? '' : '  OVER 16MB';
      console.log(
        `  ${candidate.id}  ${path.basename(candidate.file).padEnd(28)} ${size} MB${flag}`,
      );
    }
    console.log('\nNext: post each one to Status, then download what comes back into');
    console.log('returned/, keeping the two digit id as the filename prefix.');
    console.log('See experiments/README.md for the protocol.');
  },

  async status() {
    const manifest = readManifest(DIRS.candidates);
    let have = 0;
    for (const candidate of manifest.candidates) {
      const returned = findReturnedFile(DIRS.returned, candidate.id);
      if (returned !== undefined) have += 1;
      console.log(
        `  ${candidate.id}  ${returned === undefined ? 'waiting' : 'returned'}  ${candidate.label}`,
      );
    }
    console.log(`\n${have} of ${manifest.candidates.length} returned.`);
  },

  async compare() {
    const manifest = readManifest(DIRS.candidates);
    const referencePng = path.join(ROOT, path.relative(ROOT, manifest.reference.file));
    const reference = fs.existsSync(manifest.reference.file)
      ? manifest.reference.file
      : referencePng;
    if (!fs.existsSync(reference)) {
      throw new Error(`reference render missing at ${manifest.reference.file}. Re-run generate.`);
    }

    fs.mkdirSync(DIRS.work, { recursive: true });
    const results: CandidateResult[] = [];

    for (const candidate of manifest.candidates) {
      const returned = findReturnedFile(DIRS.returned, candidate.id);
      if (returned === undefined) {
        results.push({ id: candidate.id, missing: 'no returned file' });
        console.log(`  ${candidate.id}  skipped, nothing in returned/`);
        continue;
      }
      const result = await measureReturned(candidate.id, returned, reference, DIRS.work);
      results.push(result);
      console.log(
        `  ${candidate.id}  VMAF ${result.scores?.vmaf.toFixed(2)}  ` +
          `SSIM ${result.scores?.ssim.toFixed(4)}  PSNR ${result.scores?.psnr.toFixed(2)}`,
      );
    }

    // Conditions are re-read here rather than trusted from the manifest, so
    // filling in conditions.json after the posting pass and re-running compare
    // attaches them. The ffmpeg build stays as recorded at generate time.
    const scored: Manifest = {
      ...manifest,
      conditions: readConditions(ROOT, manifest.conditions.ffmpeg),
    };

    fs.mkdirSync(DIRS.resultsDir, { recursive: true });
    const report = path.join(DIRS.resultsDir, reportName(scored));
    fs.writeFileSync(report, buildReport(scored, results), 'utf8');
    refreshIndex();

    console.log(`\nWrote ${path.relative(ROOT, report)}`);
    console.log(`Updated ${RESULTS_INDEX}`);
  },

  /**
   * Puts a finished run away so the next fixture starts clean.
   *
   * Moves rather than copies the media, which can be large and has no reason to
   * exist twice. The report is copied, so it stays in the index.
   */
  async archive() {
    const manifest = readManifest(DIRS.candidates);
    const target = archiveRun(ROOT, manifest);
    refreshIndex();
    console.log(`Archived "${manifest.fixture.name}" to ${path.relative(ROOT, target)}`);
    console.log('candidates/ and returned/ are now clear for the next fixture.');
  },

  /** Rebuilds results.md from the reports on disk. */
  async reindex() {
    refreshIndex();
    const runs = readRuns(ROOT);
    console.log(`Indexed ${runs.length} run(s) into ${RESULTS_INDEX}`);
  },
};

async function main(argv: readonly string[]): Promise<void> {
  const [name, ...args] = argv;
  const command = name === undefined ? undefined : commands[name];
  if (command === undefined) {
    console.error(`usage: pnpm exp <${Object.keys(commands).join(' | ')}>`);
    process.exitCode = 1;
    return;
  }
  await command(args);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
