import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findReturnedFile, readManifest, writeManifest, type Manifest } from './manifest.js';

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pristine-exp-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const manifest: Manifest = {
  version: 1,
  createdAt: '2026-08-10T00:00:00.000Z',
  fixture: { name: 'x', file: 'fixtures/x.png', width: 1440, height: 2560, synthetic: true },
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

  it('refuses a manifest from a future version', () => {
    writeManifest(dir, { ...manifest, version: 2 as unknown as 1 });
    expect(() => readManifest(dir)).toThrow(/unsupported manifest version/);
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
