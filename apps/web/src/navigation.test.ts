import { describe, expect, it } from 'vitest';
import {
  initialNavigation,
  isScreenName,
  navigate,
  screenFromLocation,
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
