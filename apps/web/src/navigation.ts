import { useCallback, useMemo, useState } from 'react';

/**
 * Screen navigation, without a router.
 *
 * The flow is linear and there are no URLs to own yet, so a small state machine
 * covers it in far less code than a router would, and costs nothing on a
 * metered connection. When deep links or a real back-button contract are
 * needed, this is small enough to replace outright.
 *
 * The transitions are a pure function so they can be tested without a DOM.
 */
export type ScreenName =
  | 'first-run'
  | 'education'
  | 'permission'
  | 'entry'
  | 'preset'
  | 'processing'
  | 'result'
  | 'export'
  | 'split'
  | 'library'
  | 'settings';

export interface NavigationState {
  readonly screen: ScreenName;
  /** Screens behind the current one, oldest first. */
  readonly history: readonly ScreenName[];
}

export type NavigationAction =
  | { readonly type: 'go'; readonly screen: ScreenName }
  | { readonly type: 'back' }
  | { readonly type: 'reset'; readonly screen: ScreenName };

const SCREEN_NAMES: readonly ScreenName[] = [
  'first-run',
  'education',
  'permission',
  'entry',
  'preset',
  'processing',
  'result',
  'export',
  'split',
  'library',
  'settings',
];

export const isScreenName = (value: string): value is ScreenName =>
  (SCREEN_NAMES as readonly string[]).includes(value);

/**
 * Lets `?screen=` open any screen directly.
 *
 * The design's own prototype did the same thing with `?s=`, and it is the only
 * way to reach states the sample data cannot produce, such as the split screen,
 * which needs a video longer than a single Status post.
 *
 * A review affordance, not a routing scheme. Real deep links arrive with real
 * navigation, if they ever do.
 */
export function screenFromLocation(search: string, fallback: ScreenName): ScreenName {
  const requested = new URLSearchParams(search).get('screen');
  return requested !== null && isScreenName(requested) ? requested : fallback;
}

export const initialNavigation = (screen: ScreenName): NavigationState => ({
  screen,
  history: [],
});

export function navigate(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'go':
      // Re-entering the current screen is a no-op rather than a history entry,
      // so a double tap does not need two presses of back to undo.
      if (action.screen === state.screen) return state;
      return { screen: action.screen, history: [...state.history, state.screen] };

    case 'back': {
      const previous = state.history[state.history.length - 1];
      if (previous === undefined) return state;
      return { screen: previous, history: state.history.slice(0, -1) };
    }

    case 'reset':
      return initialNavigation(action.screen);
  }
}

export interface Navigation extends NavigationState {
  readonly go: (screen: ScreenName) => void;
  readonly back: () => void;
  readonly reset: (screen: ScreenName) => void;
  readonly canGoBack: boolean;
}

export function useNavigation(initial: ScreenName): Navigation {
  const [state, setState] = useState<NavigationState>(() =>
    initialNavigation(
      typeof window === 'undefined' ? initial : screenFromLocation(window.location.search, initial),
    ),
  );

  const go = useCallback(
    (screen: ScreenName) => setState((current) => navigate(current, { type: 'go', screen })),
    [],
  );
  const back = useCallback(() => setState((current) => navigate(current, { type: 'back' })), []);
  const reset = useCallback(
    (screen: ScreenName) => setState((current) => navigate(current, { type: 'reset', screen })),
    [],
  );

  return useMemo(
    () => ({ ...state, go, back, reset, canGoBack: state.history.length > 0 }),
    [state, go, back, reset],
  );
}
