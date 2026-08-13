import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CONDITIONS_NAME,
  findReturnedFile,
  readConditions,
  readManifest,
  unscoredArms,
  writeManifest,
  type Manifest,
} from './manifest.js';

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pristine-exp-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const manifest: Manifest = {
  version: 2,
  createdAt: '2026-08-10T00:00:00.000Z',
  conditions: { ffmpeg: '6.1.1-essentials_build-www.gyan.dev' },
  fixture: {
    name: 'x',
    file: 'fixtures/x.png',
    width: 1440,
    height: 2560,
    provenance: 'synthetic',
  },
  reference: { file: 'candidates/reference.png', width: 1080, height: 1920, fit: 'fit' },
  candidates: [
    {
      id: '01',
      label: 'Control, the untouched photo posted as a photo.',
      arm: 'control',
      postAs: 'photo',
      params: { jpegQuality: 2 },
      file: 'candidates/01-photo-control.jpg',
      bytes: 1000,
      underStatusLimit: true,
    },
  ],
};

describe('manifest io', () => {
  it('round trips', () => {
    writeManifest(dir, manifest);
    expect(readManifest(dir)).toEqual(manifest);
  });

  it('explains itself when generate has not run', () => {
    expect(() => readManifest(dir)).toThrow(/Run generate first/);
  });

  it('refuses a manifest from a version it does not understand', () => {
    writeManifest(dir, { ...manifest, version: 99 as unknown as 2 });
    expect(() => readManifest(dir)).toThrow(/unsupported manifest version/);
  });

  /**
   * A v1 manifest predates the conditions field, so a run generated before this
   * change has no device attached. Re-generating is cheap; pretending the
   * conditions are known is not.
   */
  it('tells you to regenerate rather than reading a v1 manifest', () => {
    writeManifest(dir, { ...manifest, version: 1 as unknown as 2 });
    expect(() => readManifest(dir)).toThrow(/Re-run generate/);
  });
});

describe('readConditions', () => {
  it('captures the ffmpeg build even with no conditions file', () => {
    expect(readConditions(dir, '6.1.1')).toEqual({ ffmpeg: '6.1.1' });
  });

  /**
   * conditions.json is hand-edited, usually on Windows, where Notepad and
   * PowerShell both write a UTF-8 BOM that JSON.parse rejects.
   */
  it('reads a file saved with a byte order mark', () => {
    const bom = String.fromCharCode(0xfeff);
    fs.writeFileSync(
      path.join(dir, CONDITIONS_NAME),
      `${bom}${JSON.stringify({ device: 'TECNO Spark 10 Pro' })}`,
      'utf8',
    );
    expect(readConditions(dir, '6.1.1').device).toBe('TECNO Spark 10 Pro');
  });

  it('reads the recorded conditions and always keeps the real ffmpeg build', () => {
    fs.writeFileSync(
      path.join(dir, CONDITIONS_NAME),
      JSON.stringify({ device: 'Infinix Hot 30', os: 'Android 13', ffmpeg: 'a lie' }),
    );
    expect(readConditions(dir, '6.1.1')).toEqual({
      ffmpeg: '6.1.1',
      device: 'Infinix Hot 30',
      os: 'Android 13',
    });
  });
});

describe('unscoredArms', () => {
  it('finds nothing when nothing has come back', () => {
    expect(unscoredArms(manifest, path.join(dir, 'returned'))).toEqual([]);
  });

  /**
   * The guard that stops generate throwing away a posting session, which is the
   * expensive part of this experiment.
   */
  it('finds arms that have come back', () => {
    const returned = path.join(dir, 'returned');
    fs.mkdirSync(returned);
    fs.writeFileSync(path.join(returned, '01-WA0007.jpg'), 'x');
    expect(unscoredArms(manifest, returned)).toEqual(['01']);
  });
});

describe('findReturnedFile', () => {
  /**
   * WhatsApp and the download flow rename files unpredictably, and differently
   * on Android than on desktop. Only the id prefix the human keeps is matched.
   */
  it('matches on the id prefix whatever the rest of the name became', () => {
    fs.writeFileSync(path.join(dir, '04-VID-20260810-WA0007.mp4'), 'x');
    expect(findReturnedFile(dir, '04')).toContain('04-VID-20260810-WA0007.mp4');
  });

  it('matches a bare id with an extension', () => {
    fs.writeFileSync(path.join(dir, '07.mp4'), 'x');
    expect(findReturnedFile(dir, '07')).toContain('07.mp4');
  });

  it('does not confuse one id for the start of another', () => {
    fs.writeFileSync(path.join(dir, '011-decoy.mp4'), 'x');
    expect(findReturnedFile(dir, '01')).toBeUndefined();
  });

  it('ignores dotfiles the OS leaves behind', () => {
    fs.writeFileSync(path.join(dir, '.DS_Store'), 'x');
    expect(findReturnedFile(dir, '01')).toBeUndefined();
  });

  it('returns undefined when nothing has come back yet', () => {
    expect(findReturnedFile(path.join(dir, 'missing'), '01')).toBeUndefined();
  });
});
