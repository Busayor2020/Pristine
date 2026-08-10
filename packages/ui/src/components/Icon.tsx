/**
 * The icon set, traced from the design export.
 *
 * Every icon draws in `currentColor` so colour comes from the token applied to
 * the surrounding text, never from a value baked into the path.
 *
 * Stroke widths stay here rather than becoming tokens. They are properties of
 * these particular drawings, not of the system, and the design used nine
 * different values across the full set. Tokenising them would freeze a
 * decision nobody has made.
 */

export interface IconProps {
  /** Rendered size in px. Defaults per icon to what the design used. */
  readonly size?: number;
  readonly className?: string;
}

interface StrokeIconProps extends IconProps {
  readonly strokeWidth: number;
  readonly children: React.ReactNode;
  readonly defaultSize: number;
}

function StrokeIcon({ size, className, strokeWidth, children, defaultSize }: StrokeIconProps) {
  const px = size ?? defaultSize;
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={22} strokeWidth={1.9}>
      <path d="M12 4.5L6.5 10l5.5 5.5" />
    </StrokeIcon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={13} strokeWidth={2.2}>
      <path d="M8 5l5 5-5 5" />
    </StrokeIcon>
  );
}

/** The two facing chevrons on the comparison handle. */
export function CompareIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={21} strokeWidth={2.1}>
      <path d="M8 6.5L4.5 10 8 13.5" />
      <path d="M12 6.5L15.5 10 12 13.5" />
    </StrokeIcon>
  );
}

/** Downward arrow over a line. Used for data cost, not for a save action. */
export function DataIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={16} strokeWidth={1.7}>
      <path d="M10 13.4V3.6" />
      <path d="M6.2 9.6L10 13.4l3.8-3.8" />
      <path d="M3.4 16.4h13.2" />
    </StrokeIcon>
  );
}

export function VideoIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={18} strokeWidth={1.7}>
      <rect x="2.4" y="4.6" width="10.6" height="10.8" rx="2" />
      <path d="M13 8.6l4.6-2.6v8l-4.6-2.6z" />
    </StrokeIcon>
  );
}
