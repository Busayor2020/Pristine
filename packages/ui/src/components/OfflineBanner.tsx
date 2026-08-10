import type { ReactNode } from 'react';

export interface OfflineBannerProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly body: string;
}

/**
 * Offline notice.
 *
 * A banner rather than a sheet, and this is the one case where that is right:
 * being offline does not stop Pristine working, it only delays sharing. A
 * sheet would block a user out of work they can still do.
 *
 * `role="status"` rather than `alert`, so it is announced without interrupting.
 */
export function OfflineBanner({ icon, title, body }: OfflineBannerProps) {
  return (
    <div className="pr-offline" role="status">
      <span className="pr-offline__icon">{icon}</span>
      <p className="pr-offline__text">
        <strong>{title}</strong> {body}
      </p>
    </div>
  );
}
