# Migration: Claude Design export to `@pristine/tokens`

Every change made while turning `Pristine - Design System.html` into a real
token system, and why.

## Reading this document

The design bundle is a self-contained HTML file: a gzip and base64 asset
manifest wrapping a nested bundle, which wraps the actual 113KB design
document. All counts below come from that inner document, not from the wrapper.

Because this repo forbids the em dash everywhere (including in its own
documentation), original strings that contained one are quoted here with the
marker `[EM]` standing in for the character.

---

## 1. Colour

### 1.1 Named by role, not by hue

The export addressed colours by their literal value at every use site. They are
now semantic. `accent` is orange today; if it becomes green, nothing downstream
is renamed. A test asserts no token name contains a hue word.

### 1.2 Surface ramp

The brief specified six base values and a `surface-0..4` naming pattern, which
is five names. The six values are authoritative, so the ramp is
**`surface-0..5`**. Flagged rather than silently dropping a step.

| Token       | Value     | Role                                        |
| ----------- | --------- | ------------------------------------------- |
| `surface-0` | `#0A0B0D` | App background                              |
| `surface-1` | `#0E1013` | Recessed panels                             |
| `surface-2` | `#121417` | Cards, inset rows                           |
| `surface-3` | `#171A1F` | Raised cards                                |
| `surface-4` | `#1B1E23` | Pressed and selected rows                   |
| `surface-5` | `#23272E` | Highest surface, doubles as `border-subtle` |

### 1.3 Off-ramp colours snapped

The export contained near-duplicates that were almost certainly drift, not
intent. Each is snapped to its nearest ramp value.

| Original  | Uses | Snapped to                 | Reason                                                      |
| --------- | ---- | -------------------------- | ----------------------------------------------------------- |
| `#101216` | 2    | `surface-2` `#121417`      | Within 2 per channel                                        |
| `#17191E` | 4    | `surface-3` `#171A1F`      | Within 1 per channel                                        |
| `#191C21` | 1    | `surface-4` `#1B1E23`      | Within 2 per channel                                        |
| `#151013` | 1    | `accent-surface` `#1C1109` | Both are the selected-preset tint                           |
| `#8B94A1` | 1    | `text-muted` `#7E8794`     | Nearer than `text-tertiary` (39 vs 44 summed channel delta) |

### 1.4 `#000000` kept as its own token

`#000` (9 uses) is the letterbox behind photos and video. Snapping it to
`surface-0` would tint the bars visibly against true-black media, so it is
`surface-media` rather than an alias. This is the one place where a second
near-black is deliberate.

### 1.5 Borders promoted to tokens

`#333941` (58 uses) and `#4A525C` (17 uses) were the two most-used colours in
the export after the text ramp, and neither appeared in the brief's ramps. They
are hairlines and dividers, so they became a border ramp rather than being
forced into the surface scale.

| Token            | Value     | Uses in export         |
| ---------------- | --------- | ---------------------- |
| `border-subtle`  | `#23272E` | Aliased to `surface-5` |
| `border-default` | `#333941` | 58                     |
| `border-strong`  | `#4A525C` | 17                     |

### 1.6 Status colours given a real shape

The brief supplied one flat hex each for error, warning and info. A single hex
is not usable: it cannot express a pressed state or a container fill, which is
why the export never used two of them at all (`#FF3D6E`, `#E8B33D` and
`#7B61FF` appear once each).

Each is expanded into the same five slots as the accent, derived by measuring
the accent's own HSL relationships and applying them to the status hue:

- **hover**: L `+0.0765`, S unchanged
- **pressed**: L `-0.0529`, S `-0.1275`
- **surface**: absolute S `0.5135`, L `0.0725`
- **border**: absolute S `0.6087`, L `0.1804`

Re-deriving the accent from its own base with these deltas reproduces
`#EF4E14` **exactly** and lands within 3/255 per channel on hover, surface and
border. The accent keeps its shipped values; only the status families are
derived.

| Family    | base      | hover     | pressed   | surface   | border    |
| --------- | --------- | --------- | --------- | --------- | --------- |
| `accent`  | `#FF5A1F` | `#FF7A46` | `#EF4E14` | `#1C1109` | `#4A2412` |
| `error`   | `#FF3D6E` | `#FF648B` | `#F13061` | `#1C090E` | `#4A1220` |
| `warning` | `#E8B33D` | `#ECC160` | `#D6A434` | `#1C1609` | `#4A3912` |
| `info`    | `#7B61FF` | `#9C88FF` | `#6C52F3` | `#0C091C` | `#1B124A` |

### 1.7 Contrast audit

Pristine's users are outdoors in daylight on mid-range Android. Every text and
surface pair was measured against WCAG 2.1. Ratios for the text ramp:

| Text             | s-0   | s-1   | s-2   | s-3   | s-4   | s-5      |
| ---------------- | ----- | ----- | ----- | ----- | ----- | -------- |
| `text-primary`   | 18.02 | 17.43 | 16.88 | 15.96 | 15.29 | 13.71    |
| `text-secondary` | 12.18 | 11.78 | 11.41 | 10.79 | 10.34 | 9.27     |
| `text-tertiary`  | 7.73  | 7.48  | 7.24  | 6.85  | 6.56  | 5.88     |
| `text-muted`     | 5.42  | 5.24  | 5.08  | 4.80  | 4.60  | **4.13** |

**One pair fails AA**: `text-muted` on `surface-5` at 4.13. It is left as-is
rather than lightened, because moving `text-muted` would shift 59 use sites to
fix one combination. The constraint is pinned by a test
(`packages/tokens/src/tokens.test.ts`) so it is visible and cannot get worse.
**Do not put muted text on `surface-5`.** Use `text-tertiary` there (5.88).

`text-on-accent` (`#0A0B0D`) clears AA on all four accent and status fills
(accent 6.31, error 5.76, warning 10.26, info 4.68).

---

## 2. Type scale

### 2.1 What was there

The export used **24 distinct font sizes**, not the 20 stated in the brief. The
extra four are the half-pixel values `12.8`, `15.5`, `16.5` and `9.5`. All 24
are accounted for below.

Five were half-pixel (`12.5`, `13.5`, `14.5`, `15.5`, `16.5`), one was
`12.8px`, and five were below 12px.

### 2.2 The 12px floor

Sizes below 12px are floored to 12 before mapping. This is a legibility
requirement, not a taste call: on a mid-range Android panel in daylight, 9.5px
text is not small, it is absent. The 22 uses of `9.5`, `10` and `10.5` were all
eyebrow labels and metadata, which is exactly the content a user squints at.

Floored values are marked `*` below.

### 2.3 Mapping

Nearest step wins. **Ties round up**, for the same daylight reason.

| New step | Value | Replaces (uses in export)                                        |
| -------- | ----- | ---------------------------------------------------------------- |
| `xs`     | 12    | 9.5\* (2), 10\* (2), 10.5\* (18), 11\* (4), 11.5\* (10), 12 (13) |
| `sm`     | 13    | 12.5 (37), 12.8 (1), 13 (13), 13.5 (29)                          |
| `md`     | 15    | 14 (17), 14.5 (22), 15 (5), 15.5 (7)                             |
| `lg`     | 17    | 16 (29), 16.5 (1), 17 (4)                                        |
| `xl`     | 20    | 19 (9), 20 (1), 22 (1)                                           |
| `2xl`    | 28    | 26 (1), 27 (1), 31 (1)                                           |
| `3xl`    | 40    | 56 (1)                                                           |

24 sizes to 7 steps. The ratios tighten at the body end (12 to 13 to 15 to 17)
and open at the display end (20 to 28 to 40), which is what a UI scale wants:
fine control where most text lives, decisive jumps where hierarchy matters.

**The one lossy step**: `56px` to `40px` is a 29% reduction, applied to the
single progress percentage on the Processing screen. Keeping a 7 step scale was
judged worth more than one oversized numeral. Revisit if the number reads weak
in situ.

### 2.4 Line height and tracking

Nine line heights collapse to 4 (`none` 1, `tight` 1.1, `snug` 1.35, `normal`
1.5), and each size step gets a paired default via `lineHeightFor`.

Thirteen tracking values collapse to 5 (`tighter` -0.04em, `tight` -0.02em,
`normal` 0, `wide` 0.02em, `widest` 0.14em).

### 2.5 Weights

The export declared `@font-face` for 400, 500, 600, 700 and 800 but only used
600, 700 and 800. The token set exposes 400 (the body default, applied
implicitly by the export), 600, 700 and 800. 500 is dropped as unused. Manrope
is variable across 200 to 800, so restoring it later costs nothing at runtime.

---

## 3. Radii

12 values were stated in the brief; the export actually had **15**
(`2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 50%`). Collapsed to 4.

| New step | Value | Replaces (uses in export)                        |
| -------- | ----- | ------------------------------------------------ |
| `sm`     | 6     | 2 (39), 3 (7), 4 (5), 5 (3), 6 (3), 7 (6), 8 (3) |
| `md`     | 12    | 9 (3), 10 (7), 11 (2), 12 (35), 14 (26)          |
| `lg`     | 20    | 16 (1), 20 (8)                                   |
| `full`   | 9999  | 50% (14)                                         |

**Note on the 39 uses of `2px`**: most are the 112x4px home indicator bar,
where a 2px radius is already a full pill. Those uses should adopt `full`, not
`sm`. CSS clamps a radius to half the box, so `sm` on a 4px-tall bar happens to
render identically, but `full` states the intent.

---

## 4. Spacing

23 distinct padding, gap and margin values, covering nearly every integer from
2 to 40. Collapsed to an 11 step ordinal scale, nearest wins, ties round up.

| New step   | Value | Replaces (uses in export)         |
| ---------- | ----- | --------------------------------- |
| `space-0`  | 0     | (new, an explicit zero)           |
| `space-1`  | 2     | 2 (2)                             |
| `space-2`  | 4     | 3 (10), 4 (10)                    |
| `space-3`  | 6     | 5 (5), 6 (25)                     |
| `space-4`  | 8     | 7 (3), 8 (14), 9 (7)              |
| `space-5`  | 12    | 10 (31), 11 (2), 12 (34), 13 (10) |
| `space-6`  | 16    | 14 (18), 15 (16), 16 (26)         |
| `space-7`  | 20    | 18 (1), 20 (56)                   |
| `space-8`  | 24    | 22 (3), 24 (7), 26 (1)            |
| `space-9`  | 32    | 28 (2), 34 (1)                    |
| `space-10` | 40    | 40 (2)                            |

Ordinal keys rather than t-shirt sizes: spacing has no natural semantic names,
and `space-6` is more honest than inventing `comfortable`.

---

## 5. Supporting primitives

Not named in the brief, but present in the export and required for a usable
system.

| Group        | Change                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| Border width | 1px and 2px kept. The single 2.5px inset ring rounds to `strong` (2px).                                        |
| Shadow       | 4 collapsed to 2, plus a ring. `0 4px 14px/50%` and `0 4px 16px/55%` were within a pixel and 5% of each other. |
| Motion       | 2 durations (160ms, 220ms) and one ease-out curve, kept as-is. Both are short enough for mid-range Android.    |
| Scrim        | The 16 ad-hoc `rgba()` overlays reduce to `sheet`, `caption` and a `blur` radius.                              |

### Deliberately not tokenised

- **Icon stroke widths.** The export used 9 values between 1.4 and 2.4. These
  are properties of the icon drawings, not of the system, and belong with the
  icon set when it lands. Tokenising them now would freeze a decision nobody
  has made yet.
- **The 390x844 frame.** That is the mockup artboard, not a breakpoint.

---

## 6. Typeface

| Before                                                                  | After                                         |
| ----------------------------------------------------------------------- | --------------------------------------------- |
| Google Fonts CDN, `<link rel="preconnect">` to two third-party origins  | Self-hosted woff2 in `packages/tokens/fonts/` |
| 6 subsets (cyrillic, cyrillic-ext, greek, latin, latin-ext, vietnamese) | 2 subsets (latin, latin-ext)                  |
| 30 `@font-face` rules (6 subsets x 5 weights)                           | 2 rules                                       |
| 74,972 bytes                                                            | 39,956 bytes                                  |

The 5 weight declarations per subset pointed at the **same file**: these are
variable fonts. Confirmed by parsing the woff2 table directory, which shows
`fvar`, `HVAR` and `STAT` in both shipped files. So one `@font-face` per subset
with `font-weight: 200 800` is exactly equivalent and drops 28 rules.

Dropping the CDN removes a cold DNS lookup, a TLS handshake and a
render-blocking round trip to a host we do not control, on connections where
that is the difference between text at 400ms and text at two seconds. It also
removes a privacy leak and fixes offline, which Pristine explicitly promises.

`font-display: swap` is retained.

Manrope is licensed under the SIL Open Font License 1.1.

---

## 7. Copy and the em dash

### 7.1 The count

The brief said sixteen. The export contains **23** em dash characters:

| Category                                                                | Count                | Handling                          |
| ----------------------------------------------------------------------- | -------------------- | --------------------------------- |
| User-facing prose                                                       | 15                   | Rewritten, listed below           |
| Placeholder library item names                                          | 4 (3 unique strings) | Rewritten, listed below           |
| Layout banner comments in the HTML, for example `ENTRY [EM] WEB, EMPTY` | 4                    | Not copy, dropped with the markup |

So **19** occurrences in strings a user could see, across **18** unique
strings. Every one is replaced.

### 7.2 Replacements

No hyphens. Each replacement is chosen for what that sentence is doing: a
period for two independent statements, a colon to introduce, a comma for an
appositive or a conjunction, parentheses for a qualifier on a label. A test
asserts no copy string contains a spaced hyphen.

| Key                      | Before                                                                | After                                    | Why                                     |
| ------------------------ | --------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------- |
| `offline.body`           | `Pristine still prepares media [EM] sharing waits until you're back.` | `... media. Sharing waits until ...`     | Two independent statements              |
| `edu.step1`              | `... handling Status media [EM] one for pictures, one for video.`     | `... media: one for pictures ...`        | Colon introduces the enumeration        |
| `edu.step3`              | `Nobody watching can tell [EM] except it holds up better.`            | `... can tell, except it holds ...`      | Comma before the exception              |
| `entryWeb.empty.body`    | `... its own file window [EM] Pristine can't see your gallery.`       | `... file window. Pristine can't ...`    | Two independent statements              |
| `preset.planNote`        | `You're on the free plan [EM] Balanced and Data Saver.`               | `... free plan: Balanced and ...`        | Colon introduces what the plan includes |
| `result.dataNote`        | `... of data to post [EM] roughly 14s on 4G.`                         | `... to post, roughly {time} ...`        | Comma, appositive                       |
| `export.document.body`   | `Nothing is re-encoded at all [EM] but it lands in a chat ...`        | `... at all, but it lands ...`           | Comma before a conjunction              |
| `split.body`             | `Status takes it in parts [EM] drag the marks ...`                    | `... in parts. Drag the marks ...`       | Statement then instruction              |
| `permission.point2`      | `Nothing is uploaded to us [EM] ever.`                                | `... uploaded to us, ever.`              | Comma, emphatic tag                     |
| `batch.presetApplied`    | `Balanced [EM] applied to all 8`                                      | `Balanced (applied to all {count})`      | Parenthesis, qualifier on a label       |
| `sheet.tooLarge.body`    | `... at the same time [EM] about 2.8 GB free ...`                     | `... same time: about {needed} free ...` | Colon introduces the figure             |
| `sheet.unsupported.body` | `The Android app reads them fine [EM] or re-save it as JPG ...`       | `... them fine, or re-save ...`          | Comma before a conjunction              |
| `sheet.lowStorage.saver` | `Use Data Saver [EM] needs 0.7 GB`                                    | `Use Data Saver (needs {size})`          | Parenthesis on a button label           |
| `sheet.item.delete`      | `Delete [EM] frees 1.9 MB`                                            | `Delete (frees {size})`                  | Parenthesis on a button label           |
| `sheet.plan.eyebrow`     | `SLOT [EM] NOT BUILT YET`                                             | `SLOT: NOT BUILT YET`                    | Colon on an eyebrow label               |
| `sample.library.1`       | `Ankara [EM] wine`                                                    | `Ankara (wine)`                          | Parenthesis, colourway qualifier        |
| `sample.library.3`       | `Ankara [EM] gold`                                                    | `Ankara (gold)`                          | Parenthesis, colourway qualifier        |
| `sample.library.5`       | `Ankara [EM] indigo`                                                  | `Ankara (indigo)`                        | Parenthesis, colourway qualifier        |

The voice is untouched otherwise. The copy is good and it was left alone.

### 7.3 Structural changes

- Strings are flat and dot-keyed in `packages/copy/src/en.ts`, ready for a
  locale file to be copied and translated.
- Values that vary (sizes, durations, counts, dimensions) are `{name}`
  placeholders rather than baked into the sentence, because word order around
  them changes between languages. The export concatenated them with `<span>`s,
  which does not survive translation.
- Enforcement: a custom ESLint rule (`pristine/no-em-dash`) fails the build on
  the character in any JS or TS source, and `tools/checks/no-em-dash.mjs`
  covers Markdown, CSS, JSON, YAML and HTML. Both run in `pnpm lint`.

---

## 8. Summary of discrepancies with the brief

Recorded because each one changed the work.

| Brief said                                          | Actual                                                           | Resolution                    |
| --------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------- |
| Base ramp of 6 values, named `surface-0..4`         | 6 values, 5 names                                                | Used `surface-0..5`           |
| 20 type sizes                                       | 24                                                               | All 24 mapped                 |
| 12 radii                                            | 15                                                               | All 15 mapped, collapsed to 4 |
| 16 em dashes                                        | 23 (19 in copy, 4 in layout comments)                            | All replaced or dropped       |
| Bundle at `./downloads/Pristine-Design-System.html` | `C:\Users\Victor Busayo\Downloads\Pristine - Design System.html` | Read from the actual path     |
