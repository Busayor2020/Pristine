import { en, format } from '@pristine/copy';
import { Button, CompareSlider, Wordmark, formatBytes } from '@pristine/ui';

export interface DesktopFirstRunScreenProps {
  readonly beforeImageSrc: string;
  readonly afterImageSrc: string;
  readonly before: { readonly width: number; readonly height: number; readonly bytes: number };
  readonly after: { readonly width: number; readonly height: number; readonly bytes: number };
  readonly onPick: () => void;
  readonly onExplain: () => void;
  readonly onLibrary: () => void;
  readonly onInstall: () => void;
}

/**
 * First run, on a laptop.
 *
 * One of the two screens the brief allows a desktop variant for. It is a
 * separate component rather than a reflow because the copy differs: on a
 * laptop "your phone" is the wrong device and "nothing leaves your phone" is a
 * promise about the wrong machine.
 *
 * The evidence sits beside the claim rather than under it, which is the whole
 * reason to use the width. Everything else is the same argument in the same
 * order.
 */
export function DesktopFirstRunScreen({
  beforeImageSrc,
  afterImageSrc,
  before,
  after,
  onPick,
  onExplain,
  onLibrary,
  onInstall,
}: DesktopFirstRunScreenProps) {
  return (
    <div className="pr-desktop">
      <header className="pr-topnav">
        <Wordmark name={en['app.name']} />
        <nav className="pr-topnav__links">
          <Button variant="quiet" className="pr-topnav__link" onClick={onExplain}>
            {en['desktop.nav.howItWorks']}
          </Button>
          <Button variant="quiet" className="pr-topnav__link" onClick={onLibrary}>
            {en['desktop.nav.library']}
          </Button>
          <Button variant="outline" onClick={onInstall}>
            {en['desktop.nav.getApp']}
          </Button>
        </nav>
      </header>

      <main className="pr-hero">
        <div className="pr-hero__copy">
          <p className="pr-eyebrow">{en['desktop.firstRun.eyebrow']}</p>
          <h1 className="pr-hero__title">{en['firstRun.title']}</h1>
          <p className="pr-hero__body">{en['desktop.firstRun.body']}</p>

          <div className="pr-hero__actions">
            <Button variant="primary" className="pr-hero__cta" onClick={onPick}>
              {en['desktop.firstRun.cta']}
            </Button>
            <Button variant="outline" className="pr-hero__secondary" onClick={onExplain}>
              {en['firstRun.secondary']}
            </Button>
          </div>

          <p className="pr-hero__reassurance">{en['desktop.firstRun.reassurance']}</p>
        </div>

        <div className="pr-hero__evidence">
          <CompareSlider
            beforeSrc={beforeImageSrc}
            afterSrc={afterImageSrc}
            alt={`${en['compare.before']}. ${en['compare.after']}.`}
            beforeLabel={en['compare.before']}
            afterLabel={en['compare.after']}
          />

          {/* One line per side here rather than the phone's stacked figures:
              there is width for it, and it reads as a direct comparison. */}
          <div className="pr-hero__stats">
            <div className="pr-hero__stat">
              <span className="pr-hero__stat-label">{en['compare.before']}</span>
              <span className="pr-hero__stat-value pr-numeric">
                {format('format.mediaMeta', {
                  width: before.width,
                  height: before.height,
                  size: formatBytes(before.bytes),
                })}
              </span>
            </div>
            <div className="pr-hero__stat">
              <span className="pr-hero__stat-label pr-hero__stat-label--accent">
                {en['compare.after']}
              </span>
              <span className="pr-hero__stat-value pr-hero__stat-value--accent pr-numeric">
                {format('format.mediaMeta', {
                  width: after.width,
                  height: after.height,
                  size: formatBytes(after.bytes),
                })}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
