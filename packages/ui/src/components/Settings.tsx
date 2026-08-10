import type { ReactNode } from 'react';
import { ChevronRightIcon } from './Icon.js';

export interface SettingsGroupProps {
  readonly label: string;
  readonly children: ReactNode;
}

/** A titled block of settings rows. */
export function SettingsGroup({ label, children }: SettingsGroupProps) {
  return (
    <section className="pr-settings__group">
      <h2 className="pr-settings__label">{label}</h2>
      <div className="pr-settings__rows">{children}</div>
    </section>
  );
}

export interface SettingsRowProps {
  readonly title: string;
  readonly description?: string;
  /** The current selection, shown at the end of the row. */
  readonly value?: string;
  readonly onClick: () => void;
  readonly numericValue?: boolean;
}

/** A row that opens something else. */
export function SettingsRow({
  title,
  description,
  value,
  onClick,
  numericValue = false,
}: SettingsRowProps) {
  return (
    <button type="button" className="pr-settings__row" onClick={onClick}>
      <span className="pr-settings__text">
        <span className="pr-settings__title">{title}</span>
        {description !== undefined && (
          <span className="pr-settings__description">{description}</span>
        )}
      </span>
      {value !== undefined && (
        <span className={`pr-settings__value${numericValue ? ' pr-numeric' : ''}`}>{value}</span>
      )}
      <ChevronRightIcon />
    </button>
  );
}

export interface ToggleRowProps {
  readonly title: string;
  readonly description?: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

/**
 * A row carrying a switch.
 *
 * A real checkbox underneath, so it is announced with its state and toggles
 * with the keyboard. The visible track and knob are drawn from it.
 */
export function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="pr-settings__row pr-settings__row--toggle">
      <span className="pr-settings__text">
        <span className="pr-settings__title">{title}</span>
        {description !== undefined && (
          <span className="pr-settings__description">{description}</span>
        )}
      </span>
      <input
        type="checkbox"
        className="pr-toggle__input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="pr-toggle" aria-hidden="true">
        <span className="pr-toggle__knob" />
      </span>
    </label>
  );
}
