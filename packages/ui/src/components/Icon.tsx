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

export function CloseIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={20} strokeWidth={1.9}>
      <path d="M5 5l10 10M15 5L5 15" />
    </StrokeIcon>
  );
}

/** Empty state for the file picker. Drawn on a 24 unit grid, unlike the rest. */
export function PhotoIcon({ size, className }: IconProps) {
  const px = size ?? 34;
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 15.5l4.6-4.2a2 2 0 0 1 2.7 0L15 15.5" />
      <path d="M14.2 13.4l1.6-1.4a2 2 0 0 1 2.6 0L21 14.2" />
      <circle cx="8.6" cy="8.8" r="1.5" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={15} strokeWidth={1.7}>
      <circle cx="10" cy="10" r="7.6" />
      <path d="M10 9.2v4.4" />
      <path d="M10 6.6h.01" />
    </StrokeIcon>
  );
}

/** A landscape frame against portrait guides. Marks non-vertical media. */
export function OrientationIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={17} strokeWidth={1.6}>
      <rect x="1.6" y="5.4" width="16.8" height="9.2" rx="1.8" />
      <path d="M7.3 2.6v14.8" strokeDasharray="2 2" />
      <path d="M12.7 2.6v14.8" strokeDasharray="2 2" />
    </StrokeIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={11} strokeWidth={2.2}>
      <path d="M2.5 6.3l2.4 2.4 4.6-5" />
    </StrokeIcon>
  );
}

/** Closed padlock. Nothing leaves the device. */
export function LockIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={15} strokeWidth={1.7}>
      <rect x="4" y="8.6" width="12" height="8" rx="2" />
      <path d="M7 8.6V6.4a3 3 0 0 1 6 0v2.2" />
    </StrokeIcon>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={20} strokeWidth={1.6}>
      <path d="M11.4 2.4H5.6a1.8 1.8 0 0 0-1.8 1.8v11.6a1.8 1.8 0 0 0 1.8 1.8h8.8a1.8 1.8 0 0 0 1.8-1.8V7.4z" />
      <path d="M11.4 2.4v5h4.8" />
    </StrokeIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={20} strokeWidth={1.7}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.6v1.8M10 15.6v1.8M17.4 10h-1.8M4.4 10H2.6M15.2 4.8l-1.3 1.3M6.1 13.9l-1.3 1.3M15.2 15.2l-1.3-1.3M6.1 6.1L4.8 4.8" />
    </StrokeIcon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={17} strokeWidth={2.2}>
      <path d="M10 4.2v11.6M4.2 10h11.6" />
    </StrokeIcon>
  );
}

/** Crossed-out signal. Offline. */
export function OfflineIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={17} strokeWidth={1.7}>
      <path d="M2 2l16 16" />
      <path d="M4.3 7.4A12 12 0 0 1 8 5.6" />
      <path d="M17.6 7.4a12 12 0 0 0-4.4-2.3" />
      <path d="M6.6 10.8a7.6 7.6 0 0 1 1.6-1" />
      <path d="M15.1 11a7.6 7.6 0 0 0-1.6-1" />
      <path d="M10 16.2h.01" />
    </StrokeIcon>
  );
}

/** A single tapped photo. Used where permission scope is explained. */
export function TapIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={17} strokeWidth={1.7}>
      <rect x="2.6" y="2.6" width="10" height="10" rx="2" />
      <path d="M8.4 11.6l2.2 6 1.5-2.6 2.9.6z" />
    </StrokeIcon>
  );
}

/** Two arrows circling. Reversible. */
export function UndoIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={17} strokeWidth={1.7}>
      <path d="M3.4 8.2a7 7 0 0 1 12-2.4" />
      <path d="M16.6 11.8a7 7 0 0 1-12 2.4" />
      <path d="M15.8 2.6v3.4h-3.4M4.2 17.4V14h3.4" />
    </StrokeIcon>
  );
}

export function SaveIcon(props: IconProps) {
  return (
    <StrokeIcon {...props} defaultSize={20} strokeWidth={1.6}>
      <path d="M10 3v9.4" />
      <path d="M6 8.6l4 3.8 4-3.8" />
      <path d="M3.4 16.6h13.2" />
    </StrokeIcon>
  );
}
