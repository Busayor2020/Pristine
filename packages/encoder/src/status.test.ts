import { describe, expect, it } from 'vitest';
import {
  STATUS_FRAME,
  STATUS_MAX_BYTES,
  fitToFrame,
  isUnderStatusLimit,
  partsRequired,
} from './status.js';

describe('status facts', () => {
  it('targets a 9:16 frame', () => {
    expect(STATUS_FRAME.width / STATUS_FRAME.height).toBeCloseTo(9 / 16, 5);
  });

  it('caps at 16MB', () => {
    expect(STATUS_MAX_BYTES).toBe(16_777_216);
  });

  it('accepts a file under the cap and rejects one over it', () => {
    expect(isUnderStatusLimit(STATUS_MAX_BYTES)).toBe(true);
    expect(isUnderStatusLimit(STATUS_MAX_BYTES + 1)).toBe(false);
    expect(isUnderStatusLimit(0)).toBe(false);
  });
});

describe('fitToFrame', () => {
  it('leaves media already matching the frame alone', () => {
    expect(fitToFrame({ width: 1080, height: 1920 }, 'fit')).toEqual(STATUS_FRAME);
    expect(fitToFrame({ width: 1080, height: 1920 }, 'crop')).toEqual(STATUS_FRAME);
  });

  it('letterboxes a landscape source in fit mode', () => {
    const drawn = fitToFrame({ width: 4032, height: 3024 }, 'fit');
    expect(drawn.width).toBe(1080);
    expect(drawn.height).toBe(810);
    expect(drawn.height).toBeLessThan(STATUS_FRAME.height);
  });

  it('overflows a landscape source in crop mode', () => {
    const drawn = fitToFrame({ width: 4032, height: 3024 }, 'crop');
    expect(drawn.height).toBe(1920);
    expect(drawn.width).toBeGreaterThan(STATUS_FRAME.width);
  });

  it('rejects a source with no area', () => {
    expect(() => fitToFrame({ width: 0, height: 100 }, 'fit')).toThrow(RangeError);
  });
});

describe('partsRequired', () => {
  it('needs no parts for empty media', () => {
    expect(partsRequired(0, 30)).toBe(0);
  });

  it('fits a clip at the limit into one part', () => {
    expect(partsRequired(30, 30)).toBe(1);
  });

  it('rounds up past the limit', () => {
    expect(partsRequired(31, 30)).toBe(2);
    expect(partsRequired(88, 30)).toBe(3);
  });

  it('honours a longer part length', () => {
    expect(partsRequired(88, 60)).toBe(2);
  });

  it('rejects a non-positive part length rather than assuming one', () => {
    expect(() => partsRequired(88, 0)).toThrow(RangeError);
  });
});
