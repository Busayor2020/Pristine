import type { ReactNode } from 'react';

export interface OptionCardProps {
  readonly name: string;
  readonly meta: string;
  readonly description: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
  /** PRO, or a quiet "Recommended". */
  readonly badge?: ReactNode;
  readonly badgeTone?: 'pro' | 'quiet';
  /** Announced instead of the visible name when the two differ. */
  readonly label?: string;
}

/**
 * One quality tier.
 *
 * A real radio, not a div with a dot. Arrow keys move between tiers, the group
 * takes one tab stop, and the selected state is announced. Rebuilding that on
 * top of buttons is how a picker ends up unusable with a keyboard or a screen
 * reader.
 */
export function OptionCard({
  name,
  meta,
  description,
  selected,
  onSelect,
  badge,
  badgeTone = 'quiet',
  label,
}: OptionCardProps) {
  return (
    <label className={`pr-option${selected ? ' pr-option--selected' : ''}`}>
      <input
        type="radio"
        className="pr-option__input"
        checked={selected}
        onChange={onSelect}
        aria-label={label ?? `${name}. ${meta}. ${description}`}
      />
      <span className="pr-option__header">
        <span className="pr-option__dot" aria-hidden="true" />
        <span className="pr-option__name">{name}</span>
        {badge !== undefined && (
          <span className={`pr-option__badge pr-option__badge--${badgeTone}`}>{badge}</span>
        )}
      </span>
      <span className="pr-option__meta pr-numeric">{meta}</span>
      <span className="pr-option__description">{description}</span>
    </label>
  );
}
