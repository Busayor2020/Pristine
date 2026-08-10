import { describe, expect, it } from 'vitest';
import {
  FLIP_FAR,
  FLIP_NEAR,
  MAX_POSITION,
  MIN_POSITION,
  clipInset,
  flipTarget,
  hasDragged,
  positionFromPointer,
} from './compare.js';

const box = { left: 100, width: 200 };

describe('positionFromPointer', () => {
  it('maps the middle of the box to the middle', () => {
    expect(positionFromPointer(200, box)).toBe(50);
  });

  it('maps a quarter across to 25', () => {
    expect(positionFromPointer(150, box)).toBe(25);
  });

  it('accounts for the box offset rather than using raw page coordinates', () => {
    expect(positionFromPointer(100, box)).toBe(MIN_POSITION);
    expect(positionFromPointer(300, box)).toBe(MAX_POSITION);
  });

  /**
   * At a true 0 or 100 one image disappears and there is nothing left to grab,
   * so the control reads as broken rather than as fully swept.
   */
  it('never lets the handle reach an edge', () => {
    expect(positionFromPointer(-9999, box)).toBe(MIN_POSITION);
    expect(positionFromPointer(9999, box)).toBe(MAX_POSITION);
  });

  /**
   * getBoundingClientRect returns a zero width box during a resize or before
   * layout. Dividing by it would produce NaN and blank the image.
   */
  it('parks in the middle rather than returning NaN for a zero width box', () => {
    expect(positionFromPointer(150, { left: 0, width: 0 })).toBe(50);
  });
});

describe('hasDragged', () => {
  it('treats a still thumb as a tap', () => {
    expect(hasDragged(100, 100)).toBe(false);
    expect(hasDragged(100, 103)).toBe(false);
  });

  it('treats real movement as a drag in both directions', () => {
    expect(hasDragged(100, 106)).toBe(true);
    expect(hasDragged(100, 94)).toBe(true);
  });
});

describe('flipTarget', () => {
  it('sends a tap to the opposite side', () => {
    expect(flipTarget(96)).toBe(FLIP_NEAR);
    expect(flipTarget(4)).toBe(FLIP_FAR);
  });

  /**
   * Repeated tapping has to alternate. If both sides of the midpoint resolved
   * the same way the control would creep to one edge and stay there.
   */
  it('alternates when tapped repeatedly', () => {
    let position = 50;
    const seen: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      position = flipTarget(position);
      seen.push(position);
    }
    expect(seen).toEqual([FLIP_FAR, FLIP_NEAR, FLIP_FAR, FLIP_NEAR]);
  });
});

describe('clipInset', () => {
  it('insets from the left so the after image sits to the right of the handle', () => {
    expect(clipInset(25)).toBe('inset(0 0 0 25%)');
  });

  it('clamps a position that somehow arrived out of range', () => {
    expect(clipInset(-10)).toBe('inset(0 0 0 0%)');
    expect(clipInset(140)).toBe('inset(0 0 0 100%)');
  });
});
