# Pristine: fix note v2

Replaces v1.

## Status as of this note

`experiments/results.md` does not exist. The harness has been checked (`doctor`
passes on ffmpeg 6.1.1 essentials, all four capabilities present) and four
synthetic charts have been written to `experiments/fixtures/`. Nothing has been
generated, posted or scored.

That means the stage 4 gate is closed. Group B below is held. Everything in
Group A is independent of the gate and is the whole of the available work.

## Ground rules

Enforced by `pnpm lint` and by policy. Breaking one fails the build.

1. No em dash anywhere. JS, TS, Markdown, CSS, JSON, YAML, HTML. Including this
   file. The replacement is a period, comma, colon or parenthesis chosen for the
   sentence, never a hyphen.
2. No colour or size literal outside `packages/tokens`. If a task needs a new
   dimension, add a token first and reference it.
3. No user-facing string literal in a component. Strings are flat dot-keyed
   entries in `packages/copy/src/en.ts` with `{name}` placeholders. Nothing is
   concatenated at the call site.
4. `packages/encoder` stays framework-free. No `react`, no `react-dom`, no
   `@pristine/ui`. Enforced by `no-restricted-imports` in `eslint.config.js`.
5. No encoder parameter lands until `experiments/results.md` exists and supports
   it. No CRF, no bitrate, no GOP, no clip duration, no fps.
6. Gate every task on `pnpm lint && pnpm typecheck && pnpm test`. Node 20.11 or
   newer, `corepack enable`, then `pnpm install`.

## Task 0: finish the experiment (Victor, not Claude Code)

Do not hand this to an agent. The middle of the protocol is a human posting
files to Status and downloading them back.

### What is left

```bash
# 3. Build the nine candidates. Run this ONCE, for ONE fixture.
pnpm exp generate <fixture>          # optional second arg: fit | crop, default fit

# 4. Post every file in experiments/candidates/ to your own Status, in id order.
#    .jpg goes as a photo, .mp4 goes as a video. Do not let another app touch
#    the file first. Let each finish uploading. Download it back from your own
#    Status. Save into experiments/returned/ keeping the two digit id prefix,
#    for example 04-anything.mp4. Only the prefix is matched.

pnpm exp status                       # how many have come back

# 5. Score it.
pnpm exp compare                      # writes experiments/results/<fixture>-<fit>.md
```

### Use a real photo, not the charts

Put a photograph straight off your phone into `experiments/fixtures/`. Not a
screenshot, not a re-save, not anything a messaging app has already handled.
Minimum 1080x1920, ideally the full sensor resolution.

`readProvenance` in `experiments/src/fixtures.ts` reads EXIF `Make` and
classifies the fixture as `phone`, `camera`, `unknown` or `synthetic`. Only
`phone` produces a decision grade result. The other three stamp a caveat banner
across the top of the report saying the run is directional only.

If the file is HEIC, HEIF, AVIF, JXL, DNG or a raw format, the bundled ffmpeg
cannot decode it (no libheif, no libjxl, no libraw). Convert to PNG or full
resolution JPEG on the phone first, with something that does not downscale.

### One fixture per cycle

`generate` writes `candidates/manifest.json` for a single fixture and overwrites
whatever was there. Complete post, return and score for one fixture before
generating the next. A0.1 and A0.2 make this safe: results are now written per
fixture, and `generate` refuses to discard a posting session that has not been
scored.

### Record the conditions

Fill in `experiments/conditions.json`, which is read at `compare` time and
printed in the report header:

- Device make and model, and the Android or iOS version
- WhatsApp version
- That it was one account, one sitting
- The ffmpeg build is captured automatically from `capabilities()`

### What the answer looks like

The verdict is arm 04 against arm 02, not arm 04 against arm 01. Arm 02 is the
photo resized to the Status frame and posted as a photo, which is the best the
photo path can do. Beating arm 01 only proves resizing helps, and resizing is
not the product.

A VMAF difference under 1 point is inside the noise floor and counts as no
result. If 04 loses to 02 across fixtures, Pristine is a resize tool and B1
through B6 change shape rather than proceeding.

## Group A0: harness ergonomics

Safe to do now, before any run exists. Doing it after a run would mean editing
the tooling that produced the numbers, which nobody should trust.

**Off limits.** Do not touch `measure.ts`, the metric invocations, the reference
normalisation, `VMAF_NOISE_FLOOR`, or the verdict logic in `report.ts`. Those
decide the answer and are already argued for in comments.

- **A0.1** Preserve results per fixture. Write to
  `experiments/results/<fixture>-<fit>.md` and keep `experiments/results.md` as
  an index listing every run with its fixture, provenance, date and headline
  verdict. The gate in `packages/encoder/src/index.ts` and
  `experiments/README.md` both reference `/experiments/results.md`, so that path
  must keep existing and keep meaning "the evidence".
- **A0.2** Do not silently discard a half finished run. Refuse when `returned/`
  is non-empty and the current manifest has unscored arms. Offer an explicit
  `--force` and an `archive` command that moves `candidates/`, `returned/` and
  the run's results into `experiments/runs/<timestamp>-<fixture>/`.
- **A0.3** Capture the environment in the manifest: the ffmpeg version string
  from `capabilities()`, plus device, OS version, WhatsApp version and a note,
  read from `experiments/conditions.json`. A result with no device attached is
  not reproducible.
- **A0.4** Say what the synthetic charts actually are. `detail` uses `testsrc2`
  and `chroma` uses `testsrc`, both generic ffmpeg patterns that overlap more
  than the labels suggest. Soften the `stresses` strings rather than leaving
  them overstating the charts.

## Group A: application work, none of it gated

- **A1** `apps/web/index.html` head: `theme-color` from the accent token,
  `apple-touch-icon` at 180x180, `apple-mobile-web-app-capable` and
  `apple-mobile-web-app-status-bar-style`, `description` from `packages/copy`,
  and Open Graph plus Twitter card tags with a 1200x630 preview. The link gets
  pasted into WhatsApp, which is the product's own distribution channel, and
  today it previews as bare text. The colour cannot be hardcoded: inject through
  `vite.config.ts` or emit from `scripts/build-icons.mjs`, and say why in a
  comment.
- **A2** Raster icons. PNG at 192, 512 and 180 from the same token-derived mark,
  plus the 1200x630 OG image. `sharp` or `@resvg/resvg-js` as a devDependency of
  `@pristine/web` only. Add the PNG entries to the `icons` array keeping the SVG
  entries, and add a manifest `id` field.
- **A3** Phone shell width on desktop. `.pr-screen` has no max width, so eight
  screens stretch to the full window. Add a token, apply above the desktop
  breakpoint with `margin-inline: auto`, and document it as distinct from the
  390x844 artboard that `MIGRATION.md` section 5 deliberately did not tokenise.
- **A4** Real file input. Replace the hardcoded `SAMPLE_FILE` with a real hidden
  `<input type="file">`, decoded dimensions, EXIF orientation, and bytes rather
  than a preformatted string. Wire the three unreachable failure sheets.
- **A5** Real fit and crop preview. `fitToFrame` is pure, tested and used by
  nothing. Draw the decoded source into a 1080x1920 canvas behind a function in
  `packages/encoder`. This is a resize, carries no encoder parameter, and is not
  gated.
- **A6** Persistence. IndexedDB, not `localStorage`, because prepared media is
  blobs. Two stores: items and settings. Not in `packages/encoder`.
- **A7** Real storage numbers. Wire `StorageMeter` and the settings rows to
  `navigator.storage.estimate()` plus the real sum of stored blobs. Hide the
  free space line rather than render `NaN` where the browser omits it.
- **A8** Back button. `pushState` on `go`, `popstate` dispatches `back`, state
  machine stays the source of truth and the URL mirrors it. No router.

## Group B: HELD

Blocked until `experiments/results.md` exists and its verdict supports the
technique. If the verdict reads "too close to call" or shows a loss, stop and
reopen the product decision rather than writing the pipeline.

- **B1** WebCodecs `VideoEncoder` in a Worker with `OffscreenCanvas`, plus an
  mp4 muxer. Every parameter cites the arm it came from.
- **B2** The fallback, and a decision before writing it. ffmpeg.wasm is 25 to
  30 MB shipped to users whose Data Saver preset exists to shave 1 MB off an
  upload. Safari has had WebCodecs since 16.4, so the gap is older iOS. Product
  call.
- **B3** Real progress. Delete `FAKE_ENCODE_MS`, drive `percent` from
  `onProgress`, wire `AbortSignal` to Cancel.
- **B4** Real export. Blob and download for save, `navigator.share({ files })`
  with a feature check for Status.
- **B5** Replace `sample-fabric-degraded.jpg`, the designer's illustration,
  with real returned media.
- **B6** Resolve the quarantine in `packages/copy/src/unverified.ts`. Promote
  with a citation, or delete `EducationScreen` and the clips setting and rewrite
  the product as a resize tool.

## Group C: backend, last

Only the Pro tier needs a server: entitlement for Max Quality, Paystack, an
anonymous device identity, APK hosting. Ship free-only first. `PresetScreen`
already takes `lockedPresets` and the plan sheet already exists as an unbuilt
slot.
