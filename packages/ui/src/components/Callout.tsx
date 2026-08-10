import type { ReactNode } from 'react';

export interface CalloutProps {
  readonly title?: string;
  readonly children: ReactNode;
  /** Optional trailing control, for example an install or upgrade action. */
  readonly action?: ReactNode;
  /** Puts the action beside the text rather than beneath it. */
  readonly inlineAction?: boolean;
}

/**
 * A bordered aside. Used for the things the browser cannot do, the plan limit,
 * and the settings hint on the education card.
 *
 * Never used for errors. Those get a sheet, because an error the user can walk
 * past is an error they will hit again.
 */
export function Callout({ title, children, action, inlineAction = false }: CalloutProps) {
  return (
    <section className={`pr-callout${inlineAction ? ' pr-callout--inline' : ''}`}>
      <div className="pr-callout__content">
        {title !== undefined && <h3 className="pr-callout__title">{title}</h3>}
        <div className="pr-callout__body">{children}</div>
      </div>
      {action !== undefined && <div className="pr-callout__action">{action}</div>}
    </section>
  );
}
