import { estimateUploadSeconds } from '@pristine/encoder';
import { en, format } from '@pristine/copy';
import { unverifiedCopy } from '@pristine/copy/unverified';
import {
  AppBar,
  Button,
  CompareSlider,
  DataIcon,
  ExplainerCard,
  NoteCard,
  StatPair,
  VideoIcon,
  formatBytes,
  formatDimensions,
  formatDuration,
} from '@pristine/ui';

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
export function ResultScreen({
  before,
  after,
  presetName,
  beforeImageSrc,
  afterImageSrc,
  onBack,
  onExport,
  onWhy,
}: ResultScreenProps) {
  const afterSize = formatBytes(after.bytes);
  const uploadSeconds = estimateUploadSeconds(after.bytes);

  return (
    <div className="pr-screen">
      <AppBar title={en['result.title']} onBack={onBack} trailing={presetName} />

      <div className="pr-screen__scroll">
        <CompareSlider
          beforeSrc={beforeImageSrc}
          afterSrc={afterImageSrc}
          alt={`${en['compare.before']}. ${en['compare.after']}.`}
          beforeLabel={en['compare.before']}
          afterLabel={en['compare.after']}
          hint={en['compare.hint']}
        />

        <div className="pr-screen__stack">
          <StatPair
            before={{
              label: en['compare.before'],
              value: formatDimensions(before.width, before.height),
              meta: formatBytes(before.bytes),
            }}
            after={{
              label: en['compare.after'],
              value: formatDimensions(after.width, after.height),
              meta: `${afterSize} · ${formatDuration(after.durationSeconds)} clip`,
            }}
          />

          <NoteCard icon={<DataIcon />}>
            {/* Split so the figure can carry tabular numerals and emphasis
                without the sentence being concatenated at the call site. */}
            {format('result.dataNote', {
              size: afterSize,
              time: formatDuration(uploadSeconds),
            })}
          </NoteCard>

          <ExplainerCard
            icon={<VideoIcon />}
            title={format('result.explainTitle', {
              seconds: Math.round(after.durationSeconds),
            })}
            body={unverifiedCopy['result.explainBody']}
            actionLabel={unverifiedCopy['result.why']}
            onAction={onWhy}
          />
        </div>
      </div>

      <div className="pr-screen__footer">
        <Button variant="primary" onClick={onExport}>
          {en['result.cta']}
        </Button>
      </div>
    </div>
  );
}
