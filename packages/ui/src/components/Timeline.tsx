import { useCallback, useRef } from 'react';
import { moveCut, nearestCut } from '../timeline.js';

export interface TimelineProps {
  /** Cut positions as a share of the clip, ascending. */
  readonly cuts: readonly number[];
  readonly onCutsChange: (cuts: number[]) => void;
  /** Filmstrip frames, left to right. */
  readonly frames: readonly string[];
  readonly label: string;
  /** Part tags drawn over the strip, one per part. */
  readonly partLabels: readonly string[];
}

/**
 * The filmstrip with draggable cut marks.
 *
 * Dragging picks up whichever mark is nearest where the thumb landed rather
 * than requiring a hit on a thin line, which at this size is the difference
 * between usable and not.
 */
export function Timeline({ cuts, onCutsChange, frames, label, partLabels }: TimelineProps) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef<number | null>(null);

  const positionOf = useCallback((clientX: number): number => {
    const strip = stripRef.current;
    if (!strip) return 0;
    const rect = strip.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return (clientX - rect.left) / rect.width;
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (cuts.length === 0) return;
      const position = positionOf(event.clientX);
      dragging.current = nearestCut(cuts, position);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Older Android webviews lack capture. The drag still works while the
        // thumb stays inside the strip.
      }
      onCutsChange(moveCut(cuts, dragging.current, position));
    },
    [cuts, onCutsChange, positionOf],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const index = dragging.current;
      if (index === null) return;
      onCutsChange(moveCut(cuts, index, positionOf(event.clientX)));
    },
    [cuts, onCutsChange, positionOf],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const bounds = [0, ...cuts, 1];

  return (
    <div
      ref={stripRef}
      className="pr-timeline"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="group"
      aria-label={label}
    >
      <div className="pr-timeline__frames" aria-hidden="true">
        {frames.map((frame, index) => (
          <img key={index} src={frame} alt="" className="pr-timeline__frame" />
        ))}
      </div>

      {partLabels.map((tag, index) => {
        const from = bounds[index] ?? 0;
        const to = bounds[index + 1] ?? 1;
        return (
          <span
            key={tag}
            className="pr-timeline__tag pr-numeric"
            style={{ left: `${((from + to) / 2) * 100}%` }}
          >
            {tag}
          </span>
        );
      })}

      {cuts.map((cut, index) => (
        <span key={index} className="pr-timeline__cut" style={{ left: `${cut * 100}%` }}>
          <span className="pr-timeline__line" />
          <span className="pr-timeline__grip" />
        </span>
      ))}
    </div>
  );
}
