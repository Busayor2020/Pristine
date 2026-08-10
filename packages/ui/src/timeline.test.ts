import { describe, expect, it } from 'vitest';
import { MIN_PART_FRACTION, evenCuts, moveCut, nearestCut, partsFromCuts } from './timeline.js';

describe('moveCut', () => {
  it('moves a cut to where it was dragged', () => {
    expect(moveCut([0.34, 0.67], 0, 0.4)).toEqual([0.4, 0.67]);
  });

  /** A cut dragged onto its neighbour would make a part of no length. */
  it('stops a cut short of the one after it', () => {
    const [first] = moveCut([0.34, 0.67], 0, 0.9);
    expect(first).toBeCloseTo(0.67 - MIN_PART_FRACTION, 6);
  });

  it('stops a cut short of the one before it', () => {
    const [, second] = moveCut([0.34, 0.67], 1, 0.1);
    expect(second).toBeCloseTo(0.34 + MIN_PART_FRACTION, 6);
  });

  it('keeps the first cut clear of the start and the last clear of the end', () => {
    expect(moveCut([0.5], 0, -5)[0]).toBeCloseTo(MIN_PART_FRACTION, 6);
    expect(moveCut([0.5], 0, 5)[0]).toBeCloseTo(1 - MIN_PART_FRACTION, 6);
  });

  it('never lets cuts reorder under the thumb', () => {
    const moved = moveCut([0.2, 0.5, 0.8], 1, 0.95);
    expect([...moved]).toEqual([...moved].sort((a, b) => a - b));
  });

  it('rejects a cut index that does not exist', () => {
    expect(() => moveCut([0.5], 3, 0.4)).toThrow(RangeError);
  });
});

describe('nearestCut', () => {
  it('picks the closer handle', () => {
    expect(nearestCut([0.25, 0.75], 0.3)).toBe(0);
    expect(nearestCut([0.25, 0.75], 0.7)).toBe(1);
  });
});

describe('partsFromCuts', () => {
  it('turns two cuts into three parts spanning the whole clip', () => {
    const parts = partsFromCuts([0.25, 0.5], 88);
    expect(parts).toHaveLength(3);
    expect(parts[0]!.from).toBe(0);
    expect(parts[2]!.to).toBe(1);
    expect(parts.reduce((total, part) => total + part.seconds, 0)).toBeCloseTo(88, 6);
  });

  it('returns the whole clip when there are no cuts', () => {
    const parts = partsFromCuts([], 20);
    expect(parts).toHaveLength(1);
    expect(parts[0]!.seconds).toBe(20);
  });
});

describe('evenCuts', () => {
  it('cuts an 88 second clip into three 30 second parts', () => {
    const cuts = evenCuts(88, 30);
    expect(cuts).toHaveLength(2);
    expect(partsFromCuts(cuts, 88)).toHaveLength(3);
  });

  it('cuts the same clip into two at 60 second parts', () => {
    expect(partsFromCuts(evenCuts(88, 60), 88)).toHaveLength(2);
  });

  it('needs no cuts when the clip already fits', () => {
    expect(evenCuts(20, 30)).toEqual([]);
  });

  it('rejects a part length of zero rather than looping forever', () => {
    expect(() => evenCuts(88, 0)).toThrow(RangeError);
  });
});
