import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Screen navigation, without a router.
 *
 * The flow is linear, so a small state machine covers it in far less code than
 * a router would, and costs nothing on a metered connection.
 *
 * The state machine is the source of truth. The History API mirrors it: `go`
 * pushes an entry, the hardware back button fires `popstate`, and the handler
 * replays that as an action against the machine. Nothing reads a screen out of
 * the URL after load, so there is one place a screen can change.
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
export function namedScreen(search: string): ScreenName | null {
  const requested = new URLSearchParams(search).get('screen');
  return requested !== null && isScreenName(requested) ? requested : null;
}

export function screenFromLocation(search: string, fallback: ScreenName): ScreenName {
  return namedScreen(search) ?? fallback;
}

/**
 * Builds the URL for a screen, keeping every other query parameter.
 *
 * The address bar has to agree with the screen, or reload and share both lie.
 * `?screen=` was already the review affordance, so mirroring reuses it rather
 * than inventing a second spelling of the same idea.
 */
export function urlFor(screen: ScreenName, pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  params.set('screen', screen);
  return `${pathname}?${params.toString()}`;
}

/** What we store on a history entry so a `popstate` can be understood. */
export interface HistoryEntry {
  readonly screen: ScreenName;
  /** How deep this entry sits in the run, counted from app load. */
  readonly index: number;
  /**
   * Which run the entry belongs to. Incremented by `reset`.
   *
   * Unwinding the browser moves off the finished entries but does not remove
   * them, so forward can still reach them. The stamp is how an entry from a
   * run that is over is told apart from a legitimate forward step.
   */
  readonly run: number;
  /**
   * The screens behind this one, as the machine had them.
   *
   * A reload throws away everything in memory but leaves the browser holding
   * its entries, so without this the first back press afterwards would move
   * the address bar and nothing else. Written here rather than to session
   * storage because it belongs to this entry, not to the tab.
   */
  readonly stack: readonly ScreenName[];
  /** Whether this tab was opened on a screen named in the URL. */
  readonly deepLinked: boolean;
}

/**
 * Reads back an entry we wrote, or null for anything else.
 *
 * `history.state` is whatever the last page put there, including null on a
 * fresh load and objects from a previous version of this app. It is untrusted
 * input and gets checked like any other.
 */
export function readEntry(value: unknown): HistoryEntry | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const screen = record['screen'];
  const index = record['index'];
  const run = record['run'];
  const stack = record['stack'];
  const deepLinked = record['deepLinked'];
  if (typeof screen !== 'string' || !isScreenName(screen)) return null;
  if (!isCount(index) || !isCount(run)) return null;
  if (typeof deepLinked !== 'boolean') return null;
  if (
    !Array.isArray(stack) ||
    !stack.every((name) => typeof name === 'string' && isScreenName(name))
  )
    return null;
  return { screen, index, run, stack: stack as ScreenName[], deepLinked };
}

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/** Where the browser sits: how deep, and in which run. */
export interface Position {
  readonly index: number;
  readonly run: number;
}

export interface PopResult {
  /** Actions to replay against the state machine, in order. */
  readonly actions: readonly NavigationAction[];
  /** Where the browser sits now, for the next comparison. */
  readonly index: number;
  /** The entry belongs to a run that is over, and should be rewritten. */
  readonly stale: boolean;
}

/**
 * Translates a `popstate` into actions for the state machine.
 *
 * A traversal is not always one step. The long press menu on a back button,
 * and `history.go(-n)`, both move several entries and report a single event,
 * so the distance is read off the entry rather than assumed to be one.
 *
 * Forward is a real button on a laptop. Replaying it as `back` would send the
 * app the opposite way to the address bar, which is the exact disagreement
 * this is meant to prevent.
 */
export function popResult(at: Position, value: unknown): PopResult {
  const entry = readEntry(value);
  // An entry we did not write means we have left our own run, most likely at
  // the load entry. One step back is the reading that cannot overshoot.
  if (entry === null) {
    return { actions: [{ type: 'back' }], index: Math.max(at.index - 1, 0), stale: false };
  }
  // A finished run is not somewhere to return to, by either button.
  if (entry.run !== at.run) return { actions: [], index: at.index, stale: true };
  if (entry.index > at.index) {
    return { actions: [{ type: 'go', screen: entry.screen }], index: entry.index, stale: false };
  }
  const actions = Array.from({ length: at.index - entry.index }, () => ({ type: 'back' }) as const);
  return { actions, index: entry.index, stale: false };
}

export const initialNavigation = (screen: ScreenName): NavigationState => ({
  screen,
  history: [],
});

/** Everything a load needs to pick up from. */
export interface Restored {
  readonly state: NavigationState;
  readonly index: number;
  readonly run: number;
  readonly deepLinked: boolean;
}

/**
 * Works out where a load starts.
 *
 * An entry of ours means this is the same tab coming back, by reload or by
 * restore, so the run continues from where it was. Anything else is someone
 * arriving: the URL may name a screen, and if it does, that was asked for by
 * hand.
 */
export function restore(value: unknown, search: string, fallback: ScreenName): Restored {
  const entry = readEntry(value);
  if (entry !== null) {
    return {
      state: { screen: entry.screen, history: entry.stack },
      index: entry.index,
      run: entry.run,
      deepLinked: entry.deepLinked,
    };
  }
  const named = namedScreen(search);
  return {
    state: initialNavigation(named ?? fallback),
    index: 0,
    run: 0,
    deepLinked: named !== null,
  };
}

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
  /** True when the app was opened on a screen named in the URL. */
  readonly deepLinked: boolean;
}

/** Applies a run of actions in order. */
const applyAll = (state: NavigationState, actions: readonly NavigationAction[]): NavigationState =>
  actions.reduce(navigate, state);

export function useNavigation(initial: ScreenName): Navigation {
  // One read of the browser, so the screen, the depth, the run and the review
  // flag all come from the same moment. Asking the URL later would not work:
  // from the first `go` onwards every URL names a screen, so "was this asked
  // for by hand" would answer itself yes forever.
  const [restored] = useState(() =>
    typeof window === 'undefined'
      ? restore(null, '', initial)
      : restore(window.history.state, window.location.search, initial),
  );

  const [state, setState] = useState<NavigationState>(restored.state);

  // The same state, readable synchronously. `go` and `reset` have to know
  // where they are before touching the browser, and an updater is the wrong
  // place to do that from: React is free to call one more than once, and a
  // replayed pushState would leave a duplicate entry behind.
  const stateRef = useRef(state);
  const commit = useCallback((next: NavigationState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  // Where the browser sits, counted from the start of the run. Equal to the
  // depth of the stack above, kept separately because `popstate` reports it
  // directly and a ref can be read from an event handler without
  // re-subscribing.
  const index = useRef(restored.index);
  // Which run we are in. Every reset starts a new one, which is what makes the
  // entries left behind by the last one recognisable.
  const run = useRef(restored.run);
  // A reset in flight. Unwinding the browser is asynchronous, so the screen it
  // lands on is set when the traversal reports back.
  const pendingReset = useRef<ScreenName | null>(null);

  const write = useCallback(
    (kind: 'push' | 'replace', next: NavigationState, at: number) => {
      if (typeof window === 'undefined') return;
      const entry: HistoryEntry = {
        screen: next.screen,
        index: at,
        run: run.current,
        stack: next.history,
        deepLinked: restored.deepLinked,
      };
      const url = urlFor(next.screen, window.location.pathname, window.location.search);
      if (kind === 'push') window.history.pushState(entry, '', url);
      else window.history.replaceState(entry, '', url);
    },
    [restored.deepLinked],
  );

  // The load entry gets a state object of its own, so a traversal back to it
  // is recognised as ours rather than read as leaving the run.
  useEffect(() => {
    write('replace', stateRef.current, index.current);
  }, [write]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const target = pendingReset.current;
      if (target !== null) {
        pendingReset.current = null;
        index.current = 0;
        const next = initialNavigation(target);
        write('replace', next, 0);
        commit(next);
        return;
      }
      const result = popResult({ index: index.current, run: run.current }, event.state);
      index.current = result.index;
      // Rewriting a finished run's entry to name the current screen keeps the
      // address bar honest, and turns a second press into a step out of the
      // app rather than another refusal.
      if (result.stale) write('replace', stateRef.current, index.current);
      if (result.actions.length > 0) commit(applyAll(stateRef.current, result.actions));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [write, commit]);

  const go = useCallback(
    (screen: ScreenName) => {
      const next = navigate(stateRef.current, { type: 'go', screen });
      // A repeated tap on the same screen is not a history entry, and the
      // machine has already said so by returning the state unchanged.
      if (next === stateRef.current) return;
      index.current += 1;
      write('push', next, index.current);
      commit(next);
    },
    [write, commit],
  );

  /**
   * Steps back through the browser rather than the machine directly.
   *
   * An in-app back button and the hardware one have to mean the same thing.
   * Handing both to `popstate` is what guarantees it, and keeps the address
   * bar from being left one screen ahead.
   */
  const back = useCallback(() => {
    if (index.current === 0) return;
    window.history.back();
  }, []);

  /**
   * Ends a run and takes its entries with it.
   *
   * Clearing only our own stack would leave the browser holding a finished
   * run, and back would walk into a result screen for work that is over. The
   * traversal removes that reach, so back from a fresh start leaves the app
   * the way it would have before the run began.
   */
  const reset = useCallback(
    (screen: ScreenName) => {
      const depth = index.current;
      run.current += 1;
      if (depth === 0) {
        const next = initialNavigation(screen);
        write('replace', next, 0);
        commit(next);
        return;
      }
      pendingReset.current = screen;
      window.history.go(-depth);
    },
    [write, commit],
  );

  return useMemo(
    () => ({
      ...state,
      go,
      back,
      reset,
      canGoBack: state.history.length > 0,
      deepLinked: restored.deepLinked,
    }),
    [state, go, back, reset, restored.deepLinked],
  );
}
