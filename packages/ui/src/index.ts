/**
 * @pristine/ui
 *
 * Shared components. Colour and dimension come from @pristine/tokens, never a
 * raw hex or a magic pixel. Strings come from @pristine/copy, never a literal.
 *
 * Consumers must also import the stylesheet:
 *
 *   import '@pristine/ui/styles.css';
 */
export { AppBar } from './components/AppBar.js';
export type { AppBarProps } from './components/AppBar.js';

export { Button } from './components/Button.js';
export type { ButtonProps, ButtonVariant } from './components/Button.js';

export { CompareSlider } from './components/CompareSlider.js';
export type { CompareSliderProps } from './components/CompareSlider.js';

export { ExplainerCard } from './components/ExplainerCard.js';
export type { ExplainerCardProps } from './components/ExplainerCard.js';

export { NoteCard } from './components/NoteCard.js';
export type { NoteCardProps } from './components/NoteCard.js';

export { StatPair } from './components/StatPair.js';
export type { StatColumn, StatPairProps } from './components/StatPair.js';

export { Wordmark } from './components/Wordmark.js';
export type { WordmarkProps } from './components/Wordmark.js';

export { Callout } from './components/Callout.js';
export type { CalloutProps } from './components/Callout.js';

export { NumberedSteps } from './components/NumberedSteps.js';
export type { NumberedStepsProps } from './components/NumberedSteps.js';

export { OptionCard } from './components/OptionCard.js';
export type { OptionCardProps } from './components/OptionCard.js';

export { ChoiceRow } from './components/ChoiceRow.js';
export type { Choice, ChoiceRowProps } from './components/ChoiceRow.js';

export { MediaSummary } from './components/MediaSummary.js';
export type { MediaSummaryProps } from './components/MediaSummary.js';

export { ProgressBar, StageList } from './components/Progress.js';
export type { ProgressBarProps, Stage, StageListProps } from './components/Progress.js';

export { DestinationButton, PrimaryDestination } from './components/DestinationButton.js';
export type {
  DestinationButtonProps,
  PrimaryDestinationProps,
} from './components/DestinationButton.js';

export { Sheet } from './components/Sheet.js';
export type { SheetProps } from './components/Sheet.js';

export { SettingsGroup, SettingsRow, ToggleRow } from './components/Settings.js';
export type {
  SettingsGroupProps,
  SettingsRowProps,
  ToggleRowProps,
} from './components/Settings.js';

export { StorageMeter } from './components/StorageMeter.js';
export type { StorageMeterProps, StorageSegment } from './components/StorageMeter.js';

export { SegmentedControl } from './components/SegmentedControl.js';
export type { Segment, SegmentedControlProps } from './components/SegmentedControl.js';

export { Timeline } from './components/Timeline.js';
export type { TimelineProps } from './components/Timeline.js';

export { LibraryGrid } from './components/LibraryGrid.js';
export type { LibraryGridProps, LibraryItem } from './components/LibraryGrid.js';

export { OfflineBanner } from './components/OfflineBanner.js';
export type { OfflineBannerProps } from './components/OfflineBanner.js';

export { MIN_PART_FRACTION, evenCuts, moveCut, nearestCut, partsFromCuts } from './timeline.js';
export type { Part } from './timeline.js';

export {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CompareIcon,
  DataIcon,
  DocumentIcon,
  InfoIcon,
  LockIcon,
  OfflineIcon,
  OrientationIcon,
  PhotoIcon,
  PlusIcon,
  SaveIcon,
  SettingsIcon,
  TapIcon,
  UndoIcon,
  VideoIcon,
} from './components/Icon.js';
export type { IconProps } from './components/Icon.js';

export {
  DRAG_THRESHOLD,
  FLIP_FAR,
  FLIP_NEAR,
  MAX_POSITION,
  MIN_POSITION,
  clipInset,
  flipTarget,
  hasDragged,
  positionFromPointer,
} from './compare.js';
export type { Bounds } from './compare.js';

export { formatBytes, formatDimensions, formatDuration } from './format.js';
