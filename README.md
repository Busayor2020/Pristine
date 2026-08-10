# Pristine

Prepare photos and video for WhatsApp Status without losing the detail WhatsApp
would otherwise re-encode away.

This repo currently contains the scaffold, the design token system and the copy
catalogue. No screens are built yet.

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

Build everything. Packages build before the app, because `apps/web/vite.config.ts`
reads the manifest colours from `@pristine/tokens`:

```bash
pnpm build
```

Run the dev server:

```bash
pnpm dev
```

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
packages/ui         Shared components. Empty until stage 5
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
