import { describe, expect, it, vi } from 'vitest';
import { STATUS_FRAME } from './status.js';
import {
  cropWouldLoseContent,
  isLyingDown,
  renderToStatusFrame,
  type DrawableSource,
} from './render.js';

/**
 * A canvas stand-in.
 *
 * The point of testing against a fake rather than a real canvas is that the
 * behaviour worth pinning is the geometry and the draw order, not the pixels.
 * jsdom has no 2d context at all, and wiring one in would test the polyfill.
 */
function fakeCanvas() {
  const calls: { fillRect?: number[]; drawImage?: number[]; fillStyle?: string; quality?: string } =
    {};
  const context = {
    set fillStyle(value: string) {
      calls.fillStyle = value;
    },
    set imageSmoothingQuality(value: string) {
      calls.quality = value;
    },
    imageSmoothingEnabled: false,
    fillRect: vi.fn((...args: number[]) => {
      calls.fillRect = args;
    }),
    drawImage: vi.fn((_source: unknown, ...args: number[]) => {
      calls.drawImage = args;
    }),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context as unknown as CanvasRenderingContext2D,
  };
  return { canvas, context, calls };
}

/**
 * A sentinel rather than a colour.
 *
 * renderToStatusFrame only passes this through to fillStyle, so a real hex
 * would test nothing extra and would put a colour literal outside the token
 * package. Passing it in is also why packages/encoder needs no dependency on
 * packages/tokens.
 */
const BACKDROP = 'the-backdrop-token';

const source = (width: number, height: number) => ({ width, height }) as DrawableSource;

describe('renderToStatusFrame', () => {
  it('sizes the canvas to the Status frame whatever the source is', () => {
    const { canvas } = fakeCanvas();
    renderToStatusFrame(source(4032, 3024), canvas, { fit: 'fit', backdrop: BACKDROP });
    expect(canvas.width).toBe(STATUS_FRAME.width);
    expect(canvas.height).toBe(STATUS_FRAME.height);
  });

  it('letterboxes a landscape source and centres it', () => {
    const { canvas, calls } = fakeCanvas();
    const drawn = renderToStatusFrame(source(4032, 3024), canvas, {
      fit: 'fit',
      backdrop: BACKDROP,
    });

    expect(drawn).toEqual({ width: 1080, height: 810 });
    // Full width, vertically centred, so the bars are equal.
    const [x, y, w, h] = calls.drawImage as number[];
    expect(x).toBe(0);
    expect(w).toBe(1080);
    expect(h).toBe(810);
    expect(y).toBe(Math.round((STATUS_FRAME.height - 810) / 2));
  });

  it('fills the frame in crop mode and overflows evenly on both sides', () => {
    const { canvas, calls } = fakeCanvas();
    const drawn = renderToStatusFrame(source(4032, 3024), canvas, {
      fit: 'crop',
      backdrop: BACKDROP,
    });

    expect(drawn.height).toBe(STATUS_FRAME.height);
    expect(drawn.width).toBeGreaterThan(STATUS_FRAME.width);
    const [x, y] = calls.drawImage as number[];
    expect(y).toBe(0);
    // Negative and symmetric: the same amount is lost from each side.
    expect(x).toBe(Math.round((STATUS_FRAME.width - drawn.width) / 2));
    expect(x).toBeLessThan(0);
  });

  it('leaves a source already at the frame ratio untouched', () => {
    const { canvas } = fakeCanvas();
    const drawn = renderToStatusFrame(source(1080, 1920), canvas, {
      fit: 'fit',
      backdrop: BACKDROP,
    });
    expect(drawn).toEqual({ width: 1080, height: 1920 });
  });

  it('paints the backdrop before drawing, so the bars are not transparent', () => {
    const { canvas, context, calls } = fakeCanvas();
    renderToStatusFrame(source(4032, 3024), canvas, { fit: 'fit', backdrop: BACKDROP });

    expect(calls.fillStyle).toBe(BACKDROP);
    expect(calls.fillRect).toEqual([0, 0, STATUS_FRAME.width, STATUS_FRAME.height]);
    const fillOrder = context.fillRect.mock.invocationCallOrder[0] as number;
    const drawOrder = context.drawImage.mock.invocationCallOrder[0] as number;
    expect(fillOrder).toBeLessThan(drawOrder);
  });

  it('asks for the best resampling the browser will give', () => {
    const { canvas, context, calls } = fakeCanvas();
    renderToStatusFrame(source(4032, 3024), canvas, { fit: 'fit', backdrop: BACKDROP });
    expect(context.imageSmoothingEnabled).toBe(true);
    expect(calls.quality).toBe('high');
  });

  it('fails loudly when there is no 2d context rather than drawing nothing', () => {
    const canvas = { width: 0, height: 0, getContext: () => null };
    expect(() =>
      renderToStatusFrame(source(100, 100), canvas, { fit: 'fit', backdrop: BACKDROP }),
    ).toThrow(/2d context/);
  });
});

describe('isLyingDown', () => {
  it('is true only for media that is actually landscape', () => {
    expect(isLyingDown({ width: 4032, height: 3024 })).toBe(true);
    expect(isLyingDown({ width: 1920, height: 1080 })).toBe(true);
  });

  /**
   * A 3:4 photo is still wider than the 9:16 frame, so cropping it does lose
   * the sides. It deliberately does not get the card: "lying down" would be a
   * lie, fit is the right default, and interrupting every ordinary upright
   * photo with a question costs more than it saves.
   */
  it('is false for an ordinary upright photo, even though cropping would trim it', () => {
    expect(isLyingDown({ width: 3024, height: 4032 })).toBe(false);
    expect(cropWouldLoseContent({ width: 3024, height: 4032 })).toBe(true);
  });

  it('is false for a square, which is not lying down either', () => {
    expect(isLyingDown({ width: 2000, height: 2000 })).toBe(false);
  });

  it('says nothing about media with no area', () => {
    expect(isLyingDown({ width: 0, height: 0 })).toBe(false);
  });
});

describe('cropWouldLoseContent', () => {
  it('is false only when the source is at least as tall as the frame', () => {
    expect(cropWouldLoseContent({ width: 1080, height: 1920 })).toBe(false);
    expect(cropWouldLoseContent({ width: 1080, height: 2400 })).toBe(false);
  });

  it('is true for anything wider than 9:16', () => {
    expect(cropWouldLoseContent({ width: 4032, height: 3024 })).toBe(true);
    expect(cropWouldLoseContent({ width: 2000, height: 2000 })).toBe(true);
  });
});
