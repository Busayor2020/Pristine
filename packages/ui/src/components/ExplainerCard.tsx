import type { ReactNode } from 'react';
import { Button } from './Button.js';
import { ChevronRightIcon } from './Icon.js';

export interface ExplainerCardProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly body: string;
  readonly actionLabel?: string;
  readonly onAction?: (() => void) | undefined;
}

/**
 * The calm inline explanation of why a photo came back as a clip.
 *
 * This is one of the two places that moment is allowed to be explained, the
 * other being the first run card. Not a tooltip and not a footnote, because a
 * user who thinks the app is broken will not go looking for either.
 */
export function ExplainerCard({ icon, title, body, actionLabel, onAction }: ExplainerCardProps) {
  return (
    <section className="pr-explainer">
      <span className="pr-explainer__icon">{icon}</span>
      <div className="pr-explainer__content">
        <h2 className="pr-explainer__title">{title}</h2>
        <p className="pr-explainer__body">{body}</p>
        {actionLabel !== undefined && onAction !== undefined && (
          <Button variant="inline" onClick={onAction} className="pr-explainer__action">
            {actionLabel}
            <ChevronRightIcon />
          </Button>
        )}
      </div>
    </section>
  );
}
