/**
 * QUARANTINE. Do not import this module from an app or a component.
 *
 * Every string here asserts the product's central hypothesis: that WhatsApp's
 * Status video pipeline preserves detail better than its image pipeline, and
 * that turning a photo into a short clip therefore survives the upload better.
 *
 * That hypothesis is UNVERIFIED. See the certainty table in the project brief
 * and the (currently absent) `/experiments/results.md`. Until real SSIM, PSNR
 * and VMAF numbers exist, shipping any of this would be asserting a quality
 * gain we have not measured.
 *
 * These strings are kept rather than deleted because they came from the design
 * export and the voice is good. They are held apart from `en` so that:
 *
 *   - `@pristine/copy` does not re-export them, so reaching them requires a
 *     deep import that is visible in review
 *   - a test asserts `en` itself carries no unmeasured quality claim
 *
 * When the experiment lands, move whatever the numbers support into `en.ts`,
 * rewrite whatever they contradict, and delete the rest. Each entry below
 * records the specific claim that has to come back true.
 */

export const unverifiedCopy = {
  /** Claim: WhatsApp routes Status stills and Status video through different pipelines. */
  'edu.step1': 'WhatsApp has two ways of handling Status media: one for pictures, one for video.',

  /** Claim: the video pipeline is measurably kinder to fine detail. */
  'edu.step2':
    'The video one is gentler with fine detail. So Pristine turns your photo into a {dimensions} clip, a few seconds long.',

  /** Claim: the clip is visually indistinguishable from a photo post, and better. */
  'edu.step3':
    'On Status it still reads as a photo post. Nobody watching can tell, except it holds up better.',

  /** Claim: more detail survives via the video path than the image path. */
  'result.explainBody':
    'WhatsApp is gentler with Status video than with still pictures, so more of your detail survives the upload. To anyone watching, it still reads as a photo post.',

  /** Presumes the technique works. */
  'result.why': 'Why this works',
} as const;

export type UnverifiedCopyKey = keyof typeof unverifiedCopy;
