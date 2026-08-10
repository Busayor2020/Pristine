export interface WordmarkProps {
  readonly name: string;
}

/**
 * The logotype: the product name in lowercase, followed by a small accent
 * square. The square is decorative and carries no meaning, so it is hidden from
 * assistive technology rather than read out as a shape.
 */
export function Wordmark({ name }: WordmarkProps) {
  return (
    <div className="pr-wordmark">
      <span className="pr-wordmark__name">{name}</span>
      <span className="pr-wordmark__dot" aria-hidden="true" />
    </div>
  );
}
