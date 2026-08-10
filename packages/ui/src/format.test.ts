import { describe, expect, it } from 'vitest';
import { formatBytes, formatDimensions, formatDuration } from './format.js';

describe('formatBytes', () => {
  /** These are the exact strings the design shows, so they are pinned. */
  it('matches the figures in the design', () => {
    expect(formatBytes(214 * 1024)).toBe('214 KB');
    expect(formatBytes(Math.round(1.9 * 1024 * 1024))).toBe('1.9 MB');
    expect(formatBytes(Math.round(1.2 * 1024 * 1024 * 1024))).toBe('1.2 GB');
  });

  it('keeps kilobytes whole and larger units to one decimal', () => {
    expect(formatBytes(1536)).toBe('2 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  });

  it('crosses each unit boundary at 1024', () => {
    expect(formatBytes(1024 * 1024 - 1)).toMatch(/KB$/);
    expect(formatBytes(1024 * 1024)).toMatch(/MB$/);
  });

  it('rejects a negative size rather than printing one', () => {
    expect(() => formatBytes(-1)).toThrow(RangeError);
  });

  /** Data cost is shown to users who do not read English decimal separators. */
  it('honours the locale separator', () => {
    expect(formatBytes(Math.round(1.9 * 1024 * 1024), 'de-DE')).toBe('1,9 MB');
  });
});

describe('formatDimensions', () => {
  it('uses a multiplication sign, not a letter x', () => {
    expect(formatDimensions(1080, 1920)).toBe('1080 × 1920');
    expect(formatDimensions(1080, 1920)).not.toContain('x');
  });

  it('does not group thousands, because these are pixel counts', () => {
    expect(formatDimensions(4032, 3024)).toBe('4032 × 3024');
  });
});

describe('formatDuration', () => {
  it('writes short clips in seconds', () => {
    expect(formatDuration(6)).toBe('6s');
    expect(formatDuration(59)).toBe('59s');
  });

  it('switches to minutes and seconds at a minute', () => {
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(88)).toBe('1:28');
  });

  it('pads the seconds so the value does not jump width', () => {
    expect(formatDuration(65)).toBe('1:05');
  });

  it('rejects a negative duration', () => {
    expect(() => formatDuration(-1)).toThrow(RangeError);
  });
});
