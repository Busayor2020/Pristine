import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, coerce } from './settings.js';
import { EMPTY_USAGE, expiredOriginals, reclaimableBytes, sumUsage } from './usage.js';
import type { StoredItem } from './db.js';

const blob = (size: number) => ({ size }) as Blob;

const item = (over: Partial<StoredItem> = {}): StoredItem => ({
  id: 'a',
  name: 'Ankara (wine)',
  createdAt: Date.now(),
  width: 1080,
  height: 1920,
  durationSeconds: 6,
  prepared: blob(1_000_000),
  ...over,
});

describe('coerce', () => {
  it('falls back to defaults for anything that is not settings', () => {
    expect(coerce(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(coerce(null)).toEqual(DEFAULT_SETTINGS);
    expect(coerce('nonsense')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps values it recognises', () => {
    const stored = { preset: 'saver', fit: 'crop', clips: false, keepOriginalsDays: 30, language: 'ha' };
    expect(coerce(stored)).toEqual(stored);
  });

  /**
   * Stored data outlives the code that wrote it. A preset dropped in a later
   * version, or a value edited by hand in devtools, must not put the app into a
   * state no screen can render.
   */
  it('replaces a preset the app no longer has', () => {
    expect(coerce({ preset: 'ultra' }).preset).toBe(DEFAULT_SETTINGS.preset);
  });

  it('replaces a fit mode it does not understand', () => {
    expect(coerce({ fit: 'stretch' }).fit).toBe(DEFAULT_SETTINGS.fit);
  });

  it('rejects a retention window that would delete originals immediately', () => {
    expect(coerce({ keepOriginalsDays: 0 }).keepOriginalsDays).toBe(
      DEFAULT_SETTINGS.keepOriginalsDays,
    );
    expect(coerce({ keepOriginalsDays: -5 }).keepOriginalsDays).toBe(
      DEFAULT_SETTINGS.keepOriginalsDays,
    );
  });

  it('rejects a retention window nobody could have chosen', () => {
    expect(coerce({ keepOriginalsDays: 99999 }).keepOriginalsDays).toBe(
      DEFAULT_SETTINGS.keepOriginalsDays,
    );
  });

  it('keeps a false clips setting rather than treating it as absent', () => {
    expect(coerce({ clips: false }).clips).toBe(false);
  });
});

describe('sumUsage', () => {
  it('adds up the blobs themselves rather than guessing', () => {
    const usage = sumUsage(
      [
        item({ id: 'a', prepared: blob(1000), original: blob(4000) }),
        item({ id: 'b', prepared: blob(2000) }),
      ],
      500,
    );
    expect(usage.preparedBytes).toBe(3000);
    expect(usage.originalsBytes).toBe(4000);
    expect(usage.itemCount).toBe(2);
  });

  /**
   * Undefined has to stay distinguishable from zero. Some browsers omit quota,
   * and a confident "0 B free" would be a lie rather than a missing value.
   */
  it('passes through an unknown free space instead of inventing one', () => {
    expect(sumUsage([], undefined).freeBytes).toBeUndefined();
    expect(sumUsage([], 0).freeBytes).toBe(0);
  });

  it('reports nothing stored as nothing used', () => {
    expect(sumUsage([], undefined)).toEqual(EMPTY_USAGE);
  });
});

describe('retention', () => {
  const now = Date.UTC(2026, 7, 13);
  const daysAgo = (days: number) => now - days * 24 * 60 * 60 * 1000;

  it('finds originals past the window and leaves the rest', () => {
    const items = [
      item({ id: 'old', createdAt: daysAgo(10), original: blob(500) }),
      item({ id: 'new', createdAt: daysAgo(2), original: blob(700) }),
    ];
    expect(expiredOriginals(items, 7, now).map((i) => i.id)).toEqual(['old']);
  });

  it('ignores items whose original is already gone', () => {
    const items = [item({ id: 'pruned', createdAt: daysAgo(100) })];
    expect(expiredOriginals(items, 7, now)).toEqual([]);
  });

  it('counts only what deleting would actually recover', () => {
    const items = [
      item({ id: 'old', createdAt: daysAgo(10), original: blob(500) }),
      item({ id: 'new', createdAt: daysAgo(2), original: blob(700) }),
      // Prepared results are kept, so they are not reclaimable this way.
      item({ id: 'pruned', createdAt: daysAgo(99), prepared: blob(9999) }),
    ];
    expect(reclaimableBytes(items, 7, now)).toBe(500);
  });

  it('recovers nothing when the window has not passed', () => {
    expect(reclaimableBytes([item({ createdAt: now, original: blob(500) })], 7, now)).toBe(0);
  });
});
