# Pristine

Prepare photos and video for WhatsApp Status without losing the detail WhatsApp
would otherwise re-encode away.

This repo currently contains the scaffold, the design token system and the copy
catalogue, and every screen in the design except the two seller mode ones.

What it does not contain is an encoder. The pipeline is gated on
`experiments/results.md`, which does not exist yet, so the app runs against
sample data with a faked encode. See [experiments/README.md](experiments/README.md).

## Setup

Requires Node 20.11 or newer. The package manager is pinned in
`package.json`, so enable Corepack once and pnpm resolves to the right version
automatically:

```bash
corepack enable
```

Then:

```bash
pnpm install
```

Build everything:

```bash
pnpm build
```

`apps/web` builds its own workspace dependencies first, via its `deps` script.
That is deliberate rather than incidental: `vite.config.ts` reads the PWA
manifest colours from `@pristine/tokens`, `scripts/build-icons.mjs` generates
the icons from the same values, and `app.css` imports the generated
`tokens.css`. All three need `packages/tokens` already built.

Because the app builds its own dependencies, `pnpm build` works from the repo
root **and** `pnpm run build` works from inside `apps/web`. That second path is
the one a host like Vercel takes when its project root is set to the app
directory, and relying on the caller to have built the packages first is how
that breaks.

Run the dev server:

```bash
pnpm dev
```

### Reaching a screen directly

There is no router. The flow is linear, so navigation is a small state machine
in `apps/web/src/navigation.ts`. To open any screen without walking to it, add
`?screen=` to the URL:

```
http://localhost:5173/?screen=split
```

Valid values are `first-run`, `education`, `permission`, `entry`, `preset`,
`processing`, `result`, `export`, `split`, `library` and `settings`. Anything
else falls back to first run rather than blanking the app.

This is a review affordance, not a routing scheme, and it is the only way to
reach states the sample data cannot produce. `split` is the clearest case: it
needs a video longer than one Status post, and the harness only carries a
photo. The design's own prototype did the same thing with `?s=`.

### Checks

```bash
pnpm lint
```

Runs four gates in order: ESLint, a Prettier format check, a repo-wide em dash
scan, and a scan for colour literals outside `packages/tokens`.

```bash
pnpm test
```

```bash
pnpm typecheck
```

## Layout

```
apps/web            React 18 + TypeScript + Vite, installable PWA
packages/tokens     Design tokens. The single source of truth for colour and sizing
packages/copy       Every user-facing string. No string literals in components
packages/ui         Shared components and the icon set
packages/encoder    Media pipeline. Framework-free, no React
experiments         CLI measurement harness. Node. Never shipped, never imported
design              Claude Design exports. Reference material, not code
tools               Local ESLint rule and the repo-wide checks
```

## Architecture

**Tokens are the floor.** `packages/tokens` holds every colour, size, radius,
weight and spacing value, authored once as TypeScript constants and generated
from those into `--pr-*` CSS custom properties. The generator is
`src/css.ts`; the two can never drift because one produces the other, and a
test asserts the shape of the output. `tools/checks/no-stray-hex.mjs` fails the
build on a colour literal anywhere else, so re-theming is a one-file change.

Colours are named by role (`surface-2`, `text-tertiary`, `accent-pressed`) and
never by hue. A test rejects any token name containing a hue word.

**The encoder knows nothing about React.** `packages/encoder` is the media
pipeline and is framework-free by policy, enforced with a
`no-restricted-imports` rule in the root ESLint config. It has to run in a
worker, in Node under test, and eventually behind a native Android bridge, so
it cannot assume a renderer. `experiments` exists to drive it from a terminal
against real files without a browser in the way.

**Copy is data.** Every user-facing string lives in `packages/copy/src/en.ts`
as a flat, dot-keyed object with `{name}` placeholders for anything that
varies. Nothing is concatenated at the call site, because word order around an
interpolated value changes between languages. Adding a locale is copying one
file. `format()` is a deliberate stand-in for a real i18n runtime, swappable in
one module.

**Unproven claims are quarantined.** The photo-as-video technique is the
product's central bet and it has not been measured. Strings that assert a
quality gain from it live in `packages/copy/src/unverified.ts`, which the
package index does not re-export, so reaching them takes a deep import that
shows up in review. Tests assert that the shipped catalogue makes no banned
compression claim, asserts no unmeasured gain, and implies no affiliation with
WhatsApp. Nothing in `packages/encoder` carries an encoder parameter yet, for
the same reason.

**The em dash is banned.** A custom ESLint rule
(`tools/eslint-rules/no-em-dash.js`) fails the build on the character in any JS
or TS source, including comments and string literals. A companion script covers
Markdown, CSS, JSON and YAML. The rule offers no autofix on purpose: the right
replacement is a period, comma, colon or parenthesis depending on the sentence,
never a hyphen, and that is an author's call.

**Manrope is self-hosted.** Two variable woff2 subsets (latin and latin-ext),
39KB total, precached by the service worker. No CDN: a third-party request on
the critical path is a cold DNS lookup and a render-blocking round trip to a
host we do not control, and it breaks the offline behaviour the product
promises.

See [MIGRATION.md](MIGRATION.md) for how every token value was derived from the
design export and what changed on the way.

## Deliberate omissions

No router, no state library, no UI kit, no backend. They get added when a
screen actually needs one.

App icons are generated as SVG from the tokens by
`apps/web/scripts/build-icons.mjs`, using a placeholder mark. Raster PNG icons
and the real wordmark should land before install and store polish, since some
Android launchers still prefer PNG for maskable icons.
