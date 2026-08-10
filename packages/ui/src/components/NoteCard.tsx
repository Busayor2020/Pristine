import type { ReactNode } from 'react';

export interface NoteCardProps {
  readonly icon: ReactNode;
  readonly children: ReactNode;
}

/** A single quiet line with a leading icon. Used for the data cost estimate. */
export function NoteCard({ icon, children }: NoteCardProps) {
  return (
    <div className="pr-note">
      <span className="pr-note__icon">{icon}</span>
      <p className="pr-note__body">{children}</p>
    </div>
  );
}
