export interface StorageSegment {
  readonly label: string;
  readonly value: string;
  /** Share of total device storage, 0 to 1. */
  readonly fraction: number;
  readonly tone: 'used' | 'secondary';
}

export interface StorageMeterProps {
  readonly headline: string;
  readonly free: string;
  readonly segments: readonly StorageSegment[];
}

/**
 * How much room Pristine is taking.
 *
 * Segments are proportional to total device storage rather than to each other,
 * so the bar answers "how much of my phone is this" instead of only "which of
 * these two is bigger". That is the question a user with a full phone is
 * actually asking.
 */
export function StorageMeter({ headline, free, segments }: StorageMeterProps) {
  return (
    <div className="pr-storage">
      <div className="pr-storage__header">
        <span className="pr-storage__headline">{headline}</span>
        <span className="pr-storage__free pr-numeric">{free}</span>
      </div>

      <div className="pr-storage__bar">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={`pr-storage__segment pr-storage__segment--${segment.tone}`}
            style={{ width: `${Math.max(0, Math.min(100, segment.fraction * 100))}%` }}
          />
        ))}
      </div>

      <ul className="pr-storage__legend">
        {segments.map((segment) => (
          <li key={segment.label} className="pr-storage__key">
            <span
              className={`pr-storage__swatch pr-storage__swatch--${segment.tone}`}
              aria-hidden="true"
            />
            {segment.label} <span className="pr-storage__amount pr-numeric">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
