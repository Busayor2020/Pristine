import type { ReactNode } from 'react';

export interface DestinationButtonProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
  readonly onClick: () => void;
  /** `outlined` for a real alternative, `bare` for the quieter one. */
  readonly variant?: 'outlined' | 'bare';
}

/** One way the prepared media can leave the app. */
export function DestinationButton({
  icon,
  title,
  description,
  onClick,
  variant = 'outlined',
}: DestinationButtonProps) {
  return (
    <button type="button" className={`pr-destination pr-destination--${variant}`} onClick={onClick}>
      <span className="pr-destination__icon">{icon}</span>
      <span className="pr-destination__content">
        <span className="pr-destination__title">{title}</span>
        <span className="pr-destination__description">{description}</span>
      </span>
    </button>
  );
}

export interface PrimaryDestinationProps {
  readonly title: string;
  readonly subtitle: string;
  readonly onClick: () => void;
}

/**
 * The main way out, with the consequence stated underneath.
 *
 * The subtitle is part of the control rather than a caption beside it, so the
 * user cannot tap it without having been told where it goes.
 */
export function PrimaryDestination({ title, subtitle, onClick }: PrimaryDestinationProps) {
  return (
    <button type="button" className="pr-primary-destination" onClick={onClick}>
      <span className="pr-primary-destination__title">{title}</span>
      <span className="pr-primary-destination__subtitle">{subtitle}</span>
    </button>
  );
}
