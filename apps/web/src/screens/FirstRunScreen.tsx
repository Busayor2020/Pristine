import { en } from '@pristine/copy';
import { Button, CompareIcon, CompareSlider, Wordmark } from '@pristine/ui';

export interface FirstRunScreenProps {
  readonly beforeImageSrc: string;
  readonly afterImageSrc: string;
  readonly onPick: () => void;
  readonly onExplain: () => void;
}

/**
 * First run.
 *
 * Makes one promise and shows the evidence for it, then gets out of the way.
 * The reassurance line under the actions is doing real work for this audience:
 * no account and nothing leaving the phone is the objection people arrive with.
 */
export function FirstRunScreen({
  beforeImageSrc,
  afterImageSrc,
  onPick,
  onExplain,
}: FirstRunScreenProps) {
  return (
    <div className="pr-screen">
      <div className="pr-screen__scroll pr-screen__scroll--wide">
        <div className="pr-firstrun__mark">
          <Wordmark name={en['app.name']} />
        </div>

        <h1 className="pr-display">{en['firstRun.title']}</h1>
        <p className="pr-lead">{en['firstRun.body']}</p>

        <CompareSlider
          beforeSrc={beforeImageSrc}
          afterSrc={afterImageSrc}
          alt={`${en['compare.before']}. ${en['compare.after']}.`}
          beforeLabel={en['compare.before']}
          afterLabel={en['compare.after']}
        />

        {/* Beneath the media here rather than over it, because this screen has
            room and the hint is teaching an interaction the user has not met. */}
        <p className="pr-firstrun__hint">
          <CompareIcon size={13} />
          {en['compare.hint']}
        </p>
      </div>

      <div className="pr-screen__footer pr-screen__footer--wide">
        <Button variant="primary" onClick={onPick}>
          {en['firstRun.cta']}
        </Button>
        <Button variant="quiet" onClick={onExplain}>
          {en['firstRun.secondary']}
        </Button>
        <p className="pr-firstrun__reassurance">{en['firstRun.reassurance']}</p>
      </div>
    </div>
  );
}
