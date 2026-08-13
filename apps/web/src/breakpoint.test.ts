import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { layout } from '@pristine/tokens';

/**
 * The one place a size literal is allowed outside packages/tokens.
 *
 * CSS cannot interpolate a custom property into a media condition:
 * `@media (min-width: var(--x))` is not valid and never has been. So the
 * breakpoint has to be written out, and the only way to stop it drifting from
 * the token is to assert they agree.
 *
 * The same number also drives `useIsDesktop`, which picks between the phone and
 * desktop variants in JS. If the CSS and the JS disagree, a screen gets the
 * desktop component with the phone's centred column, or the reverse, and it
 * looks like a layout bug rather than a constant that moved.
 */
const CSS = fs.readFileSync(path.resolve(fileURLToPath(import.meta.url), '../app.css'), 'utf8');

describe('breakpoints in CSS', () => {
  it('has at least one width media query to check', () => {
    expect(CSS).toMatch(/@media \(min-width:/);
  });

  it('never uses a width the token layer does not define', () => {
    const widths = [...CSS.matchAll(/@media \(min-width:\s*(\d+)px\)/g)].map((match) =>
      Number(match[1]),
    );
    expect(widths.length).toBeGreaterThan(0);
    for (const width of widths) {
      expect(width, `${width}px is not a breakpoint token`).toBe(layout.desktopBreakpoint);
    }
  });

  it('constrains the phone shell rather than letting it run edge to edge', () => {
    expect(CSS).toMatch(/max-width:\s*var\(--pr-layout-phone-shell-max-width\)/);
  });
});
