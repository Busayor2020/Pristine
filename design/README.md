# Design

Claude Design exports. Reference material, not code. Nothing here is imported
by an app or a package, and the repo checks skip this directory: the export is
a third-party artefact, so its em dashes and hex literals are not ours to fix.

## Files

| File                                    | What it is                                          |
| --------------------------------------- | --------------------------------------------------- |
| `Pristine-Design-System.bundle.html`    | The export exactly as downloaded, 944KB             |
| `Pristine-Design-System.extracted.html` | The readable 113KB design document pulled out of it |

The unpacker that gets from one to the other is `tools/extract-design.mjs`. It
lives there rather than here because this directory is reference material, not
code.

## screens/

27 rendered screens, the visual spec for stages 5 and 6.

Phone screens are 780x1688, exactly 2x the 390x844 design viewport. Desktop
screens are 2880x1800 and exist only for first run and library, which matches
the rule that the phone is the product.

`pristine-06` is absent. The sequence runs 01 to 28 with 06 missing, and by
elimination it is the empty state of the web entry screen, since 07 is
`entry-web-chosen`. The copy for it survives in `packages/copy`
(`entryWeb.empty.*`), so nothing is lost, but the render is not here.

### These are not experiment fixtures

Two reasons, both worth stating because the mistake is easy to make.

They are UI renders, so the photograph inside one occupies a few hundred pixels
of a screenshot. Nowhere near the 1080x1920 a fixture needs.

More importantly, **the "WhatsApp would send" side of every comparison is an
illustration, not a measurement**. It was drawn to show heavy blocking and
blur. Nothing in it came from actually posting a file to Status. It is the
product's central claim rendered as a picture, and the claim is still
unverified.

That matters for the screen we build first. The comparison slider on
`pristine-03-result` shows a dramatic difference. If the real difference turns
out to be two VMAF points, that slider oversells and has to be redrawn from
measured output rather than from the mock. See `experiments/README.md`.

### Where the build deliberately differs from these renders

If you are comparing a screen against its render and something is missing, check
here before "fixing" it.

| Render                                   | Divergence                                            | Why                                                                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `28-desktop-library`                     | No **Batch** or **Brand kit** in the sidebar          | Seller mode is phase 2, and the brief says not to scaffold for it or add the interface for later. A disabled row is still an interface for later.   |
| `17-batch-seller`, `18-brand-kit-seller` | Not built at all                                      | Same reason.                                                                                                                                        |
| Every phone screen                       | No status bar, no home indicator                      | Phone frame artefacts of the mock, not app UI. A PWA draws neither.                                                                                 |
| `03-result` and others                   | Eyebrow labels may wrap where the render has one line | The type scale floors at 12px for outdoor legibility, and the renders use 10.5px. Layouts share grid rows so the figures stay aligned when they do. |
| Library items                            | "Ankara (wine)", not "Ankara [EM] wine"               | The renders predate the punctuation pass. `packages/copy` is the source of truth for wording.                                                       |

### They also still carry em dashes

They are renders of the original export, so the on-screen text predates the
punctuation pass, for example "of data to post [EM] roughly 14s on 4G". The
copy is already fixed in `packages/copy`. Read these for layout, not for
wording.

## Why there are two

The export is a self-contained bundle, not a plain page. It is a gzip and
base64 asset manifest wrapping a nested bundle, which wraps the actual
document. Opening the bundle in an editor shows you the unpacker, not the
design.

To re-extract, or to unpack a future export:

```bash
node tools/extract-design.mjs design/Pristine-Design-System.bundle.html .tmp/out
```

Then run it again on the nested bundle it reports:

```bash
node tools/extract-design.mjs .tmp/out/assets/<inner-uuid>.html .tmp/inner
```

The second pass is needed because the bundle nests. The design document lands
at `/tmp/inner/template.html`, alongside the Manrope woff2 subsets and the mock
photography.

## What has already been taken from it

- Tokens, in `packages/tokens`. See [MIGRATION.md](../MIGRATION.md) for every
  value and what changed.
- The Manrope latin and latin-ext woff2 subsets, in `packages/tokens/fonts`.
- Copy, in `packages/copy`.

## What has not

The mock photography, and the SVG icon set. Both are still only in the export.

## A caution

The design assumes the photo-as-video technique works. Its education card and
result screen assert a quality gain we have not measured. Those strings are
quarantined in `packages/copy/src/unverified.ts` and must not be built into a
screen until `/experiments/results.md` says the technique holds up.
