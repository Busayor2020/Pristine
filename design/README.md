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
