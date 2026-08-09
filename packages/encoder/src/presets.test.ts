import { describe, expect, it } from 'vitest';
import { PRESETS, STATUS_FRAME, fitToFrame, partsRequired } from './presets.js';

describe('presets', () => {
  it('targets the Status frame for every preset', () => {
    for (const preset of Object.values(PRESETS)) {
      expect(preset.output).toEqual(STATUS_FRAME);
    }
  });

  it('orders bitrate from max down to saver', () => {
    expect(PRESETS.max.bitrate).toBeGreaterThan(PRESETS.balanced.bitrate);
    expect(PRESETS.balanced.bitrate).toBeGreaterThan(PRESETS.saver.bitrate);
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
    expect(partsRequired(0)).toBe(0);
  });

  it('fits a clip at the limit into one part', () => {
    expect(partsRequired(30)).toBe(1);
  });

  it('rounds up past the limit', () => {
    expect(partsRequired(31)).toBe(2);
    expect(partsRequired(88)).toBe(3);
  });

  it('honours a longer part length', () => {
    expect(partsRequired(88, 60)).toBe(2);
  });
});
