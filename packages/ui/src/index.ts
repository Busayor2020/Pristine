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

export {
  ChevronLeftIcon,
  ChevronRightIcon,
  CompareIcon,
  DataIcon,
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
