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
import { SYNTHETIC_FIXTURES, listFixtures, synthesise } from './fixtures.js';
import { generate } from './generate.js';
import { findReturnedFile, readManifest, writeManifest } from './manifest.js';
import { measureReturned, type CandidateResult } from './measure.js';
import { buildReport } from './report.js';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const DIRS = {
  fixtures: path.join(ROOT, 'fixtures'),
  candidates: path.join(ROOT, 'candidates'),
  returned: path.join(ROOT, 'returned'),
  work: path.join(ROOT, 'candidates', '.work'),
  results: path.join(ROOT, 'results.md'),
};

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
      process.exitCode = 1;
      return;
    }

    const fit = (args[1] ?? 'fit') as FitMode;
    if (fit !== 'fit' && fit !== 'crop') throw new TypeError('fit must be "fit" or "crop"');

    const fixture = path.isAbsolute(name) ? name : path.join(DIRS.fixtures, name);
    const resolved = fs.existsSync(fixture) ? fixture : `${fixture}.png`;

    const manifest = await generate({ fixture: resolved, outDir: DIRS.candidates, fit });
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

    fs.writeFileSync(DIRS.results, buildReport(manifest, results), 'utf8');
    console.log(`\nWrote ${path.relative(ROOT, DIRS.results)}`);
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
