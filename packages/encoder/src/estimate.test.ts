import { describe, expect, it } from 'vitest';
import { ASSUMED_UPLOAD_BPS, estimateUploadSeconds } from './estimate.js';

describe('estimateUploadSeconds', () => {
  /**
   * The assumed throughput was fitted to the three size and time pairings the
   * design states, so it has to reproduce all three. If this fails, either the
   * constant moved or the design's own arithmetic did.
   */
  it.each([
    [4.2, 31],
    [1.9, 14],
    [0.9, 7],
  ])('reproduces the design figure: %s MB in %ss', (megabytes, seconds) => {
    expect(estimateUploadSeconds(Math.round(megabytes * 1024 * 1024))).toBe(seconds);
  });

  it('scales with size', () => {
    const small = estimateUploadSeconds(1024 * 1024);
    const large = estimateUploadSeconds(4 * 1024 * 1024);
    expect(large).toBeGreaterThan(small);
  });

  it('takes no time to upload nothing', () => {
    expect(estimateUploadSeconds(0)).toBe(0);
  });

  /**
   * A sub-second estimate rendered as "0s" reads as broken. Anything with
   * bytes in it takes at least a second.
   */
  it('never claims a non-empty upload is instant', () => {
    expect(estimateUploadSeconds(1)).toBe(1);
  });

  it('accepts an override so a caller is not stuck with the assumption', () => {
    const bytes = 1024 * 1024;
    expect(estimateUploadSeconds(bytes, ASSUMED_UPLOAD_BPS * 2)).toBeLessThan(
      estimateUploadSeconds(bytes),
    );
  });

  it('rejects impossible inputs rather than returning a nonsense figure', () => {
    expect(() => estimateUploadSeconds(-1)).toThrow(RangeError);
    expect(() => estimateUploadSeconds(1024, 0)).toThrow(RangeError);
  });
});
