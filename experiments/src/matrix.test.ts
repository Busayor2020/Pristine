import { describe, expect, it } from 'vitest';
import { HELD_CONSTANT, MATRIX, describeParams } from './matrix.js';

describe('candidate matrix', () => {
  it('has unique, ordered, two digit ids', () => {
    const ids = MATRIX.map((arm) => arm.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^\d{2}$/);
    expect([...ids]).toEqual([...ids].sort());
  });

  /**
   * The binding constraint on this experiment is that a human posts every
   * candidate to Status by hand. Past roughly a dozen, the run does not get
   * finished, and an unfinished run produces no verdict at all.
   */
  it('stays small enough for one sitting', () => {
    expect(MATRIX.length).toBeLessThanOrEqual(12);
  });

  it('has both control arms and a treatment baseline', () => {
    expect(MATRIX.filter((a) => a.arm === 'control')).toHaveLength(2);
    expect(MATRIX.find((a) => a.id === '01')?.postAs).toBe('photo');
    expect(MATRIX.find((a) => a.id === '02')?.postAs).toBe('photo');
    expect(MATRIX.find((a) => a.id === '04')?.arm).toBe('treatment');
  });

  /**
   * Arm 01 is the naive path and must come from the untouched original.
   * Arm 02 is the same photo pre-resized. That pair is what isolates the
   * resize lever from the video trick.
   */
  it('sources the naive control from the original and everything else from the reference', () => {
    expect(MATRIX.find((a) => a.id === '01')?.source).toBe('original');
    for (const arm of MATRIX.filter((a) => a.id !== '01')) {
      expect(arm.source, `${arm.id} should derive from the reference render`).toBe('reference');
    }
  });

  /**
   * The whole design rests on each video arm differing from the baseline in
   * exactly one parameter. If two move at once the result is uninterpretable.
   */
  it('varies exactly one parameter per video arm against the baseline', () => {
    const baseline = MATRIX.find((a) => a.id === '04');
    expect(baseline).toBeDefined();
    const base = baseline!.params;

    const keys = ['crf', 'tune', 'duration', 'fps', 'gop'] as const;
    for (const arm of MATRIX.filter((a) => a.postAs === 'video' && a.id !== '04')) {
      const differences = keys.filter((key) => arm.params[key] !== base[key]);
      expect(differences.length, `${arm.id} varies ${differences.join(' and ')}`).toBe(1);
    }
  });

  it('holds fps constant across every video arm', () => {
    for (const arm of MATRIX.filter((a) => a.postAs === 'video')) {
      expect(arm.params.fps).toBe(HELD_CONSTANT.fps);
    }
  });

  it('gives every arm a label explaining what it isolates', () => {
    for (const arm of MATRIX) {
      expect(arm.label.length, `${arm.id} has no label`).toBeGreaterThan(20);
    }
  });
});

describe('describeParams', () => {
  it('describes a photo arm', () => {
    expect(describeParams({ jpegQuality: 2 })).toBe('JPEG q2');
  });

  it('describes a video arm and names the absent tune', () => {
    expect(describeParams({ crf: 23, duration: 3, fps: 25 })).toBe('CRF 23, 3s, 25fps, no tune');
  });

  it('includes GOP only when it is set', () => {
    expect(describeParams({ crf: 23, duration: 3, fps: 25, tune: 'stillimage', gop: 1 })).toBe(
      'CRF 23, 3s, 25fps, tune stillimage, GOP 1',
    );
    expect(describeParams({ crf: 23, duration: 3, fps: 25, tune: 'stillimage' })).not.toMatch(
      /GOP/,
    );
  });
});
