import { describe, expect, it } from 'vitest';
import {
  initialNavigation,
  isScreenName,
  namedScreen,
  navigate,
  popResult,
  readEntry,
  restore,
  screenFromLocation,
  urlFor,
  type NavigationState,
} from './navigation.js';

const at = (screen: Parameters<typeof initialNavigation>[0]) => initialNavigation(screen);

describe('navigate', () => {
  it('remembers where it came from', () => {
    const state = navigate(at('first-run'), { type: 'go', screen: 'entry' });
    expect(state.screen).toBe('entry');
    expect(state.history).toEqual(['first-run']);
  });

  it('steps back to the previous screen', () => {
    let state: NavigationState = at('first-run');
    state = navigate(state, { type: 'go', screen: 'entry' });
    state = navigate(state, { type: 'go', screen: 'preset' });
    state = navigate(state, { type: 'back' });
    expect(state.screen).toBe('entry');
    expect(state.history).toEqual(['first-run']);
  });

  /** Back at the root must not blank the screen or throw. */
  it('stays put when there is nowhere to go back to', () => {
    const root = at('first-run');
    expect(navigate(root, { type: 'back' })).toBe(root);
  });

  /**
   * A double tap on a slow phone is one intent, not two. Recording it twice
   * would need two presses of back to undo, which reads as a stuck screen.
   */
  it('treats re-entering the current screen as a no-op', () => {
    const state = at('preset');
    expect(navigate(state, { type: 'go', screen: 'preset' })).toBe(state);
  });

  it('clears history on reset, so a finished run cannot be reversed into', () => {
    let state: NavigationState = at('first-run');
    state = navigate(state, { type: 'go', screen: 'entry' });
    state = navigate(state, { type: 'go', screen: 'result' });
    state = navigate(state, { type: 'reset', screen: 'first-run' });
    expect(state).toEqual({ screen: 'first-run', history: [] });
  });

  it('recognises only real screen names', () => {
    expect(isScreenName('split')).toBe(true);
    expect(isScreenName('nonsense')).toBe(false);
  });

  /** A bad or hostile query value must not blank the app. */
  it('falls back when the query names no screen we have', () => {
    expect(screenFromLocation('?screen=split', 'first-run')).toBe('split');
    expect(screenFromLocation('?screen=nonsense', 'first-run')).toBe('first-run');
    expect(screenFromLocation('', 'first-run')).toBe('first-run');
    expect(screenFromLocation('?other=split', 'first-run')).toBe('first-run');
  });

  it('reports whether the URL named a screen at all', () => {
    // Distinct from screenFromLocation, which cannot tell "asked for the
    // screen we would have shown anyway" from "asked for nothing".
    expect(namedScreen('?screen=first-run')).toBe('first-run');
    expect(namedScreen('?screen=nonsense')).toBe(null);
    expect(namedScreen('')).toBe(null);
  });

  it('walks the whole flow and back out again', () => {
    const forward = ['entry', 'preset', 'processing', 'result', 'export'] as const;
    let state: NavigationState = at('first-run');
    for (const screen of forward) state = navigate(state, { type: 'go', screen });
    expect(state.screen).toBe('export');

    for (let i = 0; i < forward.length; i += 1) state = navigate(state, { type: 'back' });
    expect(state.screen).toBe('first-run');
    expect(state.history).toEqual([]);
  });
});

describe('urlFor', () => {
  it('names the screen in the query', () => {
    expect(urlFor('preset', '/', '')).toBe('/?screen=preset');
  });

  it('replaces a screen already there rather than appending a second', () => {
    expect(urlFor('result', '/', '?screen=preset')).toBe('/?screen=result');
  });

  /** Losing an unrelated parameter on every tap would be its own bug. */
  it('keeps the rest of the query', () => {
    expect(urlFor('entry', '/', '?utm_source=x')).toBe('/?utm_source=x&screen=entry');
  });

  it('keeps a path that is not the root, for a subdirectory deploy', () => {
    expect(urlFor('entry', '/preview/', '')).toBe('/preview/?screen=entry');
  });
});

describe('readEntry', () => {
  const entry = {
    screen: 'preset',
    index: 2,
    run: 0,
    stack: ['first-run', 'entry'],
    deepLinked: false,
  };

  it('reads back an entry we wrote', () => {
    expect(readEntry(entry)).toEqual(entry);
  });

  /**
   * history.state is whatever the last page left there. Everything below is a
   * value the browser really can hand us, and none of them may throw.
   */
  it('rejects anything else', () => {
    expect(readEntry(null)).toBe(null);
    expect(readEntry(undefined)).toBe(null);
    expect(readEntry('preset')).toBe(null);
    expect(readEntry({ ...entry, screen: 'nonsense' })).toBe(null);
    expect(readEntry({ ...entry, index: -1 })).toBe(null);
    expect(readEntry({ ...entry, index: 1.5 })).toBe(null);
    expect(readEntry({ ...entry, index: '2' })).toBe(null);
    expect(readEntry({ ...entry, stack: 'first-run' })).toBe(null);
    expect(readEntry({ ...entry, stack: ['nonsense'] })).toBe(null);
    expect(readEntry({ ...entry, deepLinked: 'yes' })).toBe(null);
  });

  /** An entry written by a build before these fields existed. */
  it('rejects an entry missing anything it needs', () => {
    for (const key of ['screen', 'index', 'run', 'stack', 'deepLinked']) {
      const partial: Record<string, unknown> = { ...entry };
      delete partial[key];
      expect(readEntry(partial), `accepted an entry with no ${key}`).toBe(null);
    }
  });
});

describe('restore', () => {
  it('picks up an interrupted run where the entry left it', () => {
    // What a reload looks like: the browser still holds the entry, memory does
    // not. Without the stack, the first back press afterwards would move the
    // address bar and leave the screen behind.
    const entry = {
      screen: 'result',
      index: 2,
      run: 1,
      stack: ['library', 'preset'],
      deepLinked: true,
    };
    expect(restore(entry, '?screen=result', 'first-run')).toEqual({
      state: { screen: 'result', history: ['library', 'preset'] },
      index: 2,
      run: 1,
      deepLinked: true,
    });
  });

  it('starts fresh for an arrival, at the screen the URL names', () => {
    expect(restore(null, '?screen=library', 'first-run')).toEqual({
      state: { screen: 'library', history: [] },
      index: 0,
      run: 0,
      deepLinked: true,
    });
  });

  it('starts fresh at the fallback when the URL names nothing', () => {
    expect(restore(null, '', 'first-run')).toEqual({
      state: { screen: 'first-run', history: [] },
      index: 0,
      run: 0,
      deepLinked: false,
    });
  });

  /**
   * The sample library keys off deepLinked. Every URL names a screen once the
   * user starts moving, so a reload must not be mistaken for a reviewer
   * asking for a screen by hand.
   */
  it('does not read our own URL as a request for a screen', () => {
    const entry = { screen: 'library', index: 1, run: 0, stack: ['entry'], deepLinked: false };
    expect(restore(entry, '?screen=library', 'first-run').deepLinked).toBe(false);
  });
});

describe('popResult', () => {
  const here = (index: number) => ({ index, run: 0 });

  it('reads one step back as one back', () => {
    expect(
      popResult(here(2), { screen: 'entry', index: 1, run: 0, stack: [], deepLinked: false }),
    ).toEqual({
      actions: [{ type: 'back' }],
      index: 1,
      stale: false,
    });
  });

  /**
   * A long press on the back button, and history.go(-n), both jump several
   * entries and report a single popstate. Treating that as one step would
   * leave the screen two ahead of the address bar.
   */
  it('reads a jump of several entries as that many backs', () => {
    expect(
      popResult(here(3), { screen: 'first-run', index: 0, run: 0, stack: [], deepLinked: false })
        .actions,
    ).toEqual([{ type: 'back' }, { type: 'back' }, { type: 'back' }]);
  });

  it('reads forward as going to that screen, not as back', () => {
    expect(
      popResult(here(1), { screen: 'preset', index: 2, run: 0, stack: [], deepLinked: false }),
    ).toEqual({
      actions: [{ type: 'go', screen: 'preset' }],
      index: 2,
      stale: false,
    });
  });

  it('does nothing when the entry is where we already are', () => {
    expect(
      popResult(here(2), { screen: 'preset', index: 2, run: 0, stack: [], deepLinked: false })
        .actions,
    ).toEqual([]);
  });

  /** An entry from before this app loaded. One step back cannot overshoot. */
  it('falls back to a single step for an entry it does not recognise', () => {
    expect(popResult(here(2), null)).toEqual({
      actions: [{ type: 'back' }],
      index: 1,
      stale: false,
    });
  });

  it('never counts the load entry below zero', () => {
    expect(popResult(here(0), null).index).toBe(0);
  });

  /**
   * Unwinding the browser on reset moves off the finished entries but leaves
   * them in place, so forward can still reach them. Without the run stamp the
   * app would walk back into a run the user has finished.
   */
  it('refuses an entry from a run that is over, in either direction', () => {
    const forward = popResult(
      { index: 0, run: 1 },
      { screen: 'result', index: 2, run: 0, stack: [], deepLinked: false },
    );
    expect(forward).toEqual({ actions: [], index: 0, stale: true });

    const backward = popResult(
      { index: 2, run: 3 },
      { screen: 'entry', index: 1, run: 2, stack: [], deepLinked: false },
    );
    expect(backward).toEqual({ actions: [], index: 2, stale: true });
  });

  it('lands on the screen the entry names, walking the machine', () => {
    let state: NavigationState = initialNavigation('first-run');
    for (const screen of ['entry', 'preset', 'processing', 'result'] as const) {
      state = navigate(state, { type: 'go', screen });
    }
    // The browser sits at index 4. A jump back to the entry screen is 3 steps.
    const { actions } = popResult(here(4), {
      screen: 'entry',
      index: 1,
      run: 0,
      stack: [],
      deepLinked: false,
    });
    const landed = actions.reduce(navigate, state);
    expect(landed.screen).toBe('entry');
    expect(landed.history).toEqual(['first-run']);
  });
});
