export interface Segment<T extends string | number> {
  readonly value: T;
  readonly label: string;
}

export interface SegmentedControlProps<T extends string | number> {
  readonly segments: readonly Segment<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly legend: string;
}

/** Two or three mutually exclusive options in a single inset track. */
export function SegmentedControl<T extends string | number>({
  segments,
  value,
  onChange,
  legend,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="pr-segmented">
      <legend className="pr-visually-hidden">{legend}</legend>
      {segments.map((segment) => (
        <label
          key={String(segment.value)}
          className={`pr-segmented__option${segment.value === value ? ' pr-segmented__option--selected' : ''}`}
        >
          <input
            type="radio"
            className="pr-segmented__input"
            checked={segment.value === value}
            onChange={() => onChange(segment.value)}
          />
          <span className="pr-numeric">{segment.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
