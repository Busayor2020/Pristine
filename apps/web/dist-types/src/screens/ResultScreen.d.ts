export interface PreparedResult {
    readonly width: number;
    readonly height: number;
    readonly bytes: number;
    readonly durationSeconds: number;
}
export interface ResultScreenProps {
    /** What WhatsApp would have produced from the untouched photo. */
    readonly before: Omit<PreparedResult, 'durationSeconds'>;
    /** What Pristine produced. */
    readonly after: PreparedResult;
    readonly presetName: string;
    readonly beforeImageSrc: string;
    readonly afterImageSrc: string;
    readonly onBack: () => void;
    readonly onExport: () => void;
    readonly onWhy: () => void;
}
/**
 * The result screen.
 *
 * The one screen that sells the product, so it is the first one built. Its job
 * is to make the difference legible in under two seconds and to be honest
 * about what posting will cost in data.
 *
 * A note on the explainer body. It is imported from `@pristine/copy/unverified`
 * rather than from the catalogue, because it asserts that the Status video
 * pipeline preserves detail better than the image pipeline, and that is still
 * unmeasured. The deep import is deliberate: it is meant to be visible here,
 * and it should be replaced from `en` once /experiments/results.md supports it.
 */
export declare function ResultScreen({ before, after, presetName, beforeImageSrc, afterImageSrc, onBack, onExport, onWhy, }: ResultScreenProps): import("react").JSX.Element;
//# sourceMappingURL=ResultScreen.d.ts.map