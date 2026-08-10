import { en, format } from '@pristine/copy';
import { Button, LockIcon, ProgressBar, StageList, type Stage } from '@pristine/ui';

export interface ProcessingScreenProps {
  /** 0 to 100. */
  readonly percent: number;
  readonly onCancel: () => void;
}

/**
 * Preparing.
 *
 * Real progress with named stages, never a spinner. On a mid-range phone this
 * screen can sit for several seconds, and a user who cannot tell whether it has
 * hung will kill the app. The stage names say what is happening now.
 *
 * The reassurance at the bottom is not decoration. This is the moment a user
 * wonders whether their photo is being uploaded somewhere.
 */
export function ProcessingScreen({ percent, onCancel }: ProcessingScreenProps) {
  const stages: Stage[] = [
    { name: en['processing.stage.analysing'] },
    { name: en['processing.stage.reducingNoise'] },
    { name: en['processing.stage.matchingDimensions'] },
    { name: en['processing.stage.encoding'] },
  ];

  // Four evenly weighted stages. Real stage boundaries arrive with the encoder.
  const activeIndex = Math.min(stages.length - 1, Math.floor((percent / 100) * stages.length));

  return (
    <div className="pr-screen">
      <header className="pr-appbar">
        <h1 className="pr-appbar__title">{en['processing.title']}</h1>
      </header>

      <div className="pr-screen__scroll pr-screen__scroll--column">
        <ProgressBar
          percent={percent}
          label={format('processing.percent', { percent: Math.round(percent) })}
        />
        <StageList stages={stages} activeIndex={activeIndex} />

        <p className="pr-hint pr-hint--footnote">
          <LockIcon />
          {en['processing.note']}
        </p>
      </div>

      <div className="pr-screen__footer">
        <Button variant="outline" className="pr-button--block" onClick={onCancel}>
          {en['action.cancel']}
        </Button>
      </div>
    </div>
  );
}
