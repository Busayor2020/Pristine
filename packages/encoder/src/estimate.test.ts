import { describe, expect, it } from 'vitest';
import { ASSUMED_UPLOAD_BPS, estimateUploadSeconds } from './estimate.js';

describe('estimateUploadSeconds', () => {
  /**
   * The design pairs "1.9 MB" with "roughly 14s on 4G". The assumed throughput
   * was derived from that pairing, so it has to reproduce it. If this test
   * fails, either the constant moved or the design's own arithmetic did.
   */
  it('reproduces the figure the design shows', () => {
    expect(estimateUploadSeconds(Math.round(1.9 * 1024 * 1024))).toBe(14);
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
