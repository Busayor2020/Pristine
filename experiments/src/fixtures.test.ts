import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  FIXTURE_SIZE,
  SYNTHETIC_FIXTURES,
  isSynthetic,
  listFixtures,
  listUndecodable,
  undecodableReason,
} from './fixtures.js';

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pristine-fx-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('synthetic fixtures', () => {
  it('generates above the Status frame so the reference render downscales', () => {
    expect(FIXTURE_SIZE.width).toBeGreaterThan(1080);
    expect(FIXTURE_SIZE.height).toBeGreaterThan(1920);
  });

  it('names the failure mode each chart stresses', () => {
    for (const fixture of SYNTHETIC_FIXTURES) {
      expect(fixture.stresses.length, `${fixture.name} has no rationale`).toBeGreaterThan(20);
    }
  });

  it('has unique names', () => {
    const names = SYNTHETIC_FIXTURES.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('recognises its own charts so the report can warn about them', () => {
    expect(isSynthetic('/wherever/detail.png')).toBe(true);
    expect(isSynthetic('/wherever/IMG_20260810.jpg')).toBe(false);
  });
});

describe('format support', () => {
  it('accepts what the bundled ffmpeg can decode', () => {
    for (const name of ['a.png', 'b.jpg', 'c.jpeg', 'd.webp', 'e.tif']) {
      fs.writeFileSync(path.join(dir, name), 'x');
    }
    expect(listFixtures(dir)).toHaveLength(5);
  });

  /**
   * ffmpeg-static ships without libheif, so the iPhone default silently fails.
   * Reporting an empty directory would send someone hunting for the wrong bug.
   */
  it('does not offer a HEIC as a usable fixture', () => {
    fs.writeFileSync(path.join(dir, 'IMG_0001.HEIC'), 'x');
    expect(listFixtures(dir)).toHaveLength(0);
    expect(listUndecodable(dir)).toEqual(['IMG_0001.HEIC']);
  });

  it('explains why, and says what to do instead', () => {
    const reason = undecodableReason('IMG_0001.heic');
    expect(reason).toMatch(/libheif/);
    expect(reason).toMatch(/PNG or JPEG/);
  });

  it('covers the other formats a phone or camera might hand over', () => {
    for (const ext of ['.heif', '.avif', '.jxl', '.dng', '.cr2', '.nef']) {
      expect(undecodableReason(`shot${ext}`), ext).toBeDefined();
    }
  });

  it('says nothing about a format that works', () => {
    expect(undecodableReason('shot.jpg')).toBeUndefined();
  });
});
