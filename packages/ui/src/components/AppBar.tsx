import type { ReactNode } from 'react';
import { ChevronLeftIcon } from './Icon.js';

export interface AppBarProps {
  readonly title: string;
  /** Omit to render no back control, for a root screen. */
  readonly onBack?: (() => void) | undefined;
  readonly backLabel?: string;
  /** Quiet trailing status, for example the active preset. */
  readonly trailing?: ReactNode;
}

/**
 * Screen header.
 *
 * Nothing critical lives up here. The brief keeps important controls out of the
 * top third of the screen, so this carries a title, a way back, and status.
 */
export function AppBar({ title, onBack, backLabel = 'Back', trailing }: AppBarProps) {
  return (
    <header className="pr-appbar">
      {onBack !== undefined && (
        <button type="button" className="pr-appbar__back" onClick={onBack} aria-label={backLabel}>
          <ChevronLeftIcon />
        </button>
      )}
      <h1 className="pr-appbar__title">{title}</h1>
      {trailing !== undefined && <div className="pr-appbar__trailing">{trailing}</div>}
    </header>
  );
}
