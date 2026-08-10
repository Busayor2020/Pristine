import { useCallback, useState } from 'react';
import { en, format, templateParts } from '@pristine/copy';
import {
  AppBar,
  Button,
  Callout,
  InfoIcon,
  SegmentedControl,
  Timeline,
  evenCuts,
  formatBytes,
  formatDuration,
  partsFromCuts,
} from '@pristine/ui';

/**
 * Bytes per second of prepared clip, used to size each part.
 *
 * UNVERIFIED. Back-derived from the design's own pairing of a 6 second clip
 * with 1.9 MB. Replaced once results.md gives a real bitrate.
 */
const BYTES_PER_SECOND = Math.round((1.9 * 1024 * 1024) / 6);

/** Part lengths Status accepts, in seconds. Both come from the design. */
const PART_LENGTHS = [30, 60] as const;
type PartLength = (typeof PART_LENGTHS)[number];

export interface SplitScreenProps {
  readonly durationSeconds: number;
  readonly frames: readonly string[];
  /** Parts the current plan allows before it gates. */
  readonly maxFreeParts: number;
  readonly onBack: () => void;
  readonly onPrepare: (parts: number) => void;
  readonly onSeePlans: () => void;
}

/**
 * Cutting a clip too long for one Status post.
 *
 * Switching part length re-cuts evenly rather than keeping marks that no
 * longer make sense at the new length. Dragging then adjusts from there, so
 * the common case needs no dragging at all.
 */
export function SplitScreen({
  durationSeconds,
  frames,
  maxFreeParts,
  onBack,
  onPrepare,
  onSeePlans,
}: SplitScreenProps) {
  const [partLength, setPartLength] = useState<PartLength>(PART_LENGTHS[0]);
  const [cuts, setCuts] = useState<number[]>(() => evenCuts(durationSeconds, PART_LENGTHS[0]));

  const changeLength = useCallback(
    (next: PartLength) => {
      setPartLength(next);
      setCuts(evenCuts(durationSeconds, next));
    },
    [durationSeconds],
  );

  const parts = partsFromCuts(cuts, durationSeconds);
  const overLimit = parts.length > maxFreeParts;

  return (
    <div className="pr-screen">
      <AppBar title={en['split.title']} onBack={onBack} />

      <div className="pr-screen__scroll">
        <p className="pr-lead pr-lead--small">
          {templateParts('split.body').map((part, index) =>
            part.kind === 'text' ? (
              part.text
            ) : (
              <strong key={index} className="pr-numeric">
                {formatDuration(durationSeconds)}
              </strong>
            ),
          )}
        </p>

        <SegmentedControl
          legend={en['split.title']}
          value={partLength}
          onChange={changeLength}
          segments={[
            { value: PART_LENGTHS[0], label: en['split.30'] },
            { value: PART_LENGTHS[1], label: en['split.60'] },
          ]}
        />

        <div className="pr-screen__stack">
          <Timeline
            cuts={cuts}
            onCutsChange={setCuts}
            frames={frames}
            label={en['split.title']}
            partLabels={parts.map((part) => `P${part.index + 1}`)}
          />

          <ol className="pr-parts">
            {parts.map((part) => (
              <li className="pr-parts__item" key={part.index}>
                <span className="pr-parts__number pr-numeric">{part.index + 1}</span>
                <span className="pr-parts__label">
                  {format('split.part', { index: part.index + 1, total: parts.length })}
                </span>
                <span className="pr-parts__range pr-numeric">
                  {format('split.range', {
                    from: formatDuration(part.from * durationSeconds),
                    to: formatDuration(part.to * durationSeconds),
                  })}
                </span>
                <span className="pr-parts__size pr-numeric">
                  {formatBytes(part.seconds * BYTES_PER_SECOND, { unit: 'MB' })}
                </span>
              </li>
            ))}
          </ol>

          <p className="pr-hint">
            <InfoIcon />
            {en['split.order']}
          </p>

          {overLimit && (
            <Callout
              inlineAction
              action={
                <Button variant="inline" onClick={onSeePlans}>
                  {en['action.seePlans']}
                </Button>
              }
            >
              {format('split.limit', { needed: parts.length })}
            </Callout>
          )}
        </div>
      </div>

      <div className="pr-screen__footer">
        <Button variant="primary" onClick={() => onPrepare(parts.length)}>
          {format('split.cta', { count: parts.length })}
        </Button>
      </div>
    </div>
  );
}
