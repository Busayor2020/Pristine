import type { ReactNode } from 'react';

export interface MediaSummaryProps {
  readonly thumbnailSrc: string;
  readonly title: string;
  readonly meta: string;
  /** Optional control under the metadata, for example changing the file. */
  readonly action?: ReactNode;
  /** Boxed on the entry screen, bare with a rule beneath it on export. */
  readonly variant?: 'card' | 'bare';
  /** Truncates a long filename to one line. */
  readonly truncateTitle?: boolean;
}

/** A thumbnail beside a filename and its dimensions. */
export function MediaSummary({
  thumbnailSrc,
  title,
  meta,
  action,
  variant = 'card',
  truncateTitle = false,
}: MediaSummaryProps) {
  return (
    <div className={`pr-media pr-media--${variant}`}>
      <div className="pr-media__thumb">
        <img src={thumbnailSrc} alt="" />
      </div>
      <div className="pr-media__content">
        <div className={`pr-media__title${truncateTitle ? ' pr-media__title--truncate' : ''}`}>
          {title}
        </div>
        <div className="pr-media__meta pr-numeric">{meta}</div>
        {action}
      </div>
    </div>
  );
}
