import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';

export interface SheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  /** Stacked beneath the body. The first is the recommended way out. */
  readonly actions?: ReactNode;
  /** Hides the visible title while keeping it as the accessible name. */
  readonly hideTitle?: boolean;
}

/**
 * Bottom sheet.
 *
 * Every error and gate in the product is a sheet rather than an inline banner,
 * because an error a user can scroll past is an error they hit again. A sheet
 * blocks until it is dealt with, and always offers a way forward rather than
 * only a way out.
 *
 * The focus handling is the part that matters and the part usually skipped:
 * focus moves in on open and returns to the trigger on close, Escape closes,
 * and Tab cycles inside. Without that, a screen reader user lands behind the
 * scrim with no way back.
 */
export function Sheet({ open, onClose, title, children, actions, hideTitle = false }: SheetProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const focusables = useCallback((): HTMLElement[] => {
    const panel = panelRef.current;
    if (!panel) return [];
    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    // Focus the panel itself rather than the first control, so the sheet's
    // title is announced before its options.
    panelRef.current?.focus();

    // The page behind must not scroll while the sheet owns the screen.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [open, onClose, focusables]);

  if (!open) return null;

  return (
    <div className="pr-sheet-layer">
      {/* Presentational: Escape and the sheet's own actions are the labelled
          ways out, so this does not need to be a button as well. */}
      <div className="pr-sheet__scrim" onClick={onClose} role="presentation" />
      <div
        ref={panelRef}
        className="pr-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="pr-sheet__grip" aria-hidden="true" />
        <h2 id={titleId} className={hideTitle ? 'pr-visually-hidden' : 'pr-sheet__title'}>
          {title}
        </h2>
        <div className="pr-sheet__body">{children}</div>
        {actions !== undefined && <div className="pr-sheet__actions">{actions}</div>}
      </div>
    </div>
  );
}
