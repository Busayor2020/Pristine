import { useEffect, useState } from 'react';
import { layout } from '@pristine/tokens';

/**
 * Tracks a media query.
 *
 * Used to pick between the phone and desktop variants rather than rendering
 * both and hiding one. Two copies in the DOM would mean shipping both sets of
 * strings and keeping two trees in sync, and the desktop copy is genuinely
 * different rather than a reflow, so there is nothing to share.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = (event: MediaQueryListEvent) => setMatches(event.matches);
    // Re-read on mount as well: the query may have changed between the initial
    // state and the effect running.
    setMatches(list.matches);
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
}

const DESKTOP_QUERY = `(min-width: ${layout.desktopBreakpoint}px)`;

/** True when there is room for the desktop variants. */
export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}
