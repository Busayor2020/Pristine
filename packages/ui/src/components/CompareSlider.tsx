import { useCallback, useRef, useState } from 'react';
import { CompareIcon } from './Icon.js';
import { clipInset, flipTarget, hasDragged, positionFromPointer } from '../compare.js';

export interface CompareSliderProps {
  readonly beforeSrc: string;
  readonly afterSrc: string;
  /** Alternative text for the whole comparison, not for each half. */
  readonly alt: string;
  readonly beforeLabel: string;
  readonly afterLabel: string;
  /** Overlaid on the media. Omit when the screen places the hint beneath. */
  readonly hint?: string | undefined;
  /** Starting handle position, 0 to 100. */
  readonly initialPosition?: number;
}

/**
 * The before and after comparison.
 *
 * Drag the handle to sweep between the two images, or tap anywhere to flip.
 * Tap-to-flip matters more than it looks: the product is used one handed
 * outdoors, and a drag needs a steady thumb that a moving bus does not allow.
 *
 * Pointer events rather than mouse or touch, so one code path covers finger,
 * stylus and mouse. `setPointerCapture` keeps the drag alive when the thumb
 * slides outside the box, which happens constantly at this size.
 */
export function CompareSlider({
  beforeSrc,
  afterSrc,
  alt,
  beforeLabel,
  afterLabel,
  hint,
  initialPosition = 50,
}: CompareSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ startX: number; moved: boolean } | null>(null);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { startX: event.clientX, moved: false };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is unavailable on some older Android webviews. The drag still
      // works, it just stops if the thumb leaves the element.
    }
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const box = boxRef.current;
    if (!state || !box) return;
    if (!hasDragged(state.startX, event.clientX)) return;
    state.moved = true;
    setPosition(positionFromPointer(event.clientX, box.getBoundingClientRect()));
  }, []);

  const onPointerUp = useCallback(() => {
    const state = drag.current;
    drag.current = null;
    if (state && !state.moved) setPosition(flipTarget);
  }, []);

  return (
    <div
      ref={boxRef}
      className="pr-compare"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="img"
      aria-label={alt}
    >
      <img className="pr-compare__image" src={beforeSrc} alt="" />
      <div className="pr-compare__after" style={{ clipPath: clipInset(position) }}>
        <img className="pr-compare__image" src={afterSrc} alt="" />
      </div>

      <div className="pr-compare__divider" style={{ left: `${position}%` }} />
      <div className="pr-compare__handle" style={{ left: `${position}%` }}>
        <CompareIcon />
      </div>

      <div className="pr-compare__label pr-compare__label--before">{beforeLabel}</div>
      <div className="pr-compare__label pr-compare__label--after">{afterLabel}</div>
      {hint !== undefined && <div className="pr-compare__hint">{hint}</div>}
    </div>
  );
}
