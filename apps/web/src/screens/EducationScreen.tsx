import { en, templateParts, templatePartsOf } from '@pristine/copy';
import { unverifiedCopy } from '@pristine/copy/unverified';
import { Button, Callout, CloseIcon, NumberedSteps, formatDimensions } from '@pristine/ui';
import { STATUS_FRAME } from '@pristine/encoder';

export interface EducationScreenProps {
  readonly onDismiss: () => void;
}

/**
 * The one-time explanation of why a photo comes back as a clip.
 *
 * Every numbered step here is quarantined copy: all three assert that the
 * Status video pipeline preserves detail better than the image pipeline, which
 * is unmeasured. This whole screen is provisional until results.md lands, and
 * if the measurement goes the other way it is the screen that gets deleted.
 */
export function EducationScreen({ onDismiss }: EducationScreenProps) {
  const dimensions = formatDimensions(STATUS_FRAME.width, STATUS_FRAME.height);

  return (
    <div className="pr-screen">
      <header className="pr-appbar pr-appbar--end">
        <button
          type="button"
          className="pr-appbar__back"
          onClick={onDismiss}
          aria-label={en['action.close']}
        >
          <CloseIcon />
        </button>
      </header>

      <div className="pr-screen__scroll pr-screen__scroll--wide">
        <p className="pr-eyebrow">{en['edu.eyebrow']}</p>
        <h1 className="pr-display pr-display--small">{en['edu.title']}</h1>
        <p className="pr-lead pr-lead--tight">{en['edu.subtitle']}</p>

        <NumberedSteps
          steps={[
            unverifiedCopy['edu.step1'],
            // Split so the dimensions can carry tabular numerals and emphasis
            // without the sentence being assembled from fragments.
            templatePartsOf(unverifiedCopy['edu.step2']).map((part, index) =>
              part.kind === 'text' ? part.text : <strong key={index}>{dimensions}</strong>,
            ),
            unverifiedCopy['edu.step3'],
          ]}
        />

        <div className="pr-screen__stack">
          <Callout>
            {templateParts('edu.note').map((part, index) =>
              part.kind === 'text' ? (
                part.text
              ) : (
                <strong key={index}>{en['edu.settingsPath']}</strong>
              ),
            )}
          </Callout>
        </div>
      </div>

      <div className="pr-screen__footer pr-screen__footer--wide">
        <Button variant="primary" onClick={onDismiss}>
          {en['edu.cta']}
        </Button>
      </div>
    </div>
  );
}
