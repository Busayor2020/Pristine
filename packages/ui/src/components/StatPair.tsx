export interface StatColumn {
  readonly label: string;
  readonly value: string;
  readonly meta: string;
}

export interface StatPairProps {
  readonly before: StatColumn;
  readonly after: StatColumn;
}

/**
 * The two column before and after figures under the comparison.
 *
 * Laid out as a single grid rather than two side by side columns, so the two
 * values sit on the same baseline even when one label wraps and the other does
 * not. That is not hypothetical: the 12px type floor makes
 * "WHATSAPP WOULD SEND" wrap where the design had it on one line, and
 * translation will do the same to other labels in other languages.
 *
 * Numbers are tabular so the columns align on the decimal and a value updating
 * in place does not shift the layout.
 */
export function StatPair({ before, after }: StatPairProps) {
  return (
    <div className="pr-stats">
      <div className="pr-stats__label pr-stats__before-label">{before.label}</div>
      <div className="pr-stats__value pr-stats__before-value pr-numeric">{before.value}</div>
      <div className="pr-stats__meta pr-stats__before-meta pr-numeric">{before.meta}</div>

      <div className="pr-stats__divider" role="presentation" />

      <div className="pr-stats__label pr-stats__label--accent pr-stats__after-label">
        {after.label}
      </div>
      <div className="pr-stats__value pr-stats__value--accent pr-stats__after-value pr-numeric">
        {after.value}
      </div>
      <div className="pr-stats__meta pr-stats__meta--accent pr-stats__after-meta pr-numeric">
        {after.meta}
      </div>
    </div>
  );
}
