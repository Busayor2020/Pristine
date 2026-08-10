import type { FitMode } from '@pristine/encoder';
import { en, format } from '@pristine/copy';
import {
  AppBar,
  Button,
  Callout,
  ChoiceRow,
  InfoIcon,
  MediaSummary,
  OrientationIcon,
  PhotoIcon,
} from '@pristine/ui';

export interface ChosenFile {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly size: string;
}

export interface EntryScreenProps {
  /** Absent until the OS file picker hands something back. */
  readonly file?: ChosenFile | undefined;
  readonly thumbnailSrc: string;
  readonly fit: FitMode;
  readonly onFitChange: (fit: FitMode) => void;
  readonly onBrowse: () => void;
  readonly onBack: () => void;
  readonly onContinue: () => void;
  readonly onInstall: () => void;
}

/**
 * Adding media, in the browser.
 *
 * Built honestly around what a browser actually gives us: an OS file dialog,
 * one file at a time, and no sight of the gallery. The design does not mock a
 * grid the web build cannot deliver, and neither does this. Where the Android
 * app is genuinely better, that is stated as an offer rather than as a dead
 * control.
 */
export function EntryScreen({
  file,
  thumbnailSrc,
  fit,
  onFitChange,
  onBrowse,
  onBack,
  onContinue,
  onInstall,
}: EntryScreenProps) {
  // Anything wider than it is tall has to be told how to fill a 9:16 frame.
  const isLandscape = file !== undefined && file.width > file.height;

  return (
    <div className="pr-screen">
      <AppBar title={en['entry.title']} onBack={onBack} />

      <div className="pr-screen__scroll">
        {file === undefined ? (
          <div className="pr-dropzone">
            <span className="pr-dropzone__icon">
              <PhotoIcon />
            </span>
            <h2 className="pr-dropzone__title">{en['entryWeb.empty.title']}</h2>
            <p className="pr-dropzone__body">{en['entryWeb.empty.body']}</p>
            <Button variant="outline" className="pr-dropzone__action" onClick={onBrowse}>
              {en['entryWeb.empty.cta']}
            </Button>
          </div>
        ) : (
          <MediaSummary
            thumbnailSrc={thumbnailSrc}
            title={file.name}
            truncateTitle
            meta={format('format.mediaMeta', {
              width: file.width,
              height: file.height,
              size: file.size,
            })}
            action={
              <Button variant="inline" onClick={onBrowse}>
                {en['entryWeb.changeFile']}
              </Button>
            }
          />
        )}

        <div className="pr-screen__stack">
          {file === undefined && (
            <p className="pr-hint">
              <InfoIcon />
              {en['entryWeb.empty.note']}
            </p>
          )}

          {isLandscape && (
            <section className="pr-callout pr-callout--strong">
              <div className="pr-callout__lead">
                <span className="pr-callout__icon">
                  <OrientationIcon />
                </span>
                <div>
                  <h3 className="pr-callout__title">{en['orientation.title']}</h3>
                  <p className="pr-callout__body">{en['orientation.body']}</p>
                </div>
              </div>
              <ChoiceRow
                legend={en['orientation.title']}
                value={fit}
                onChange={onFitChange}
                choices={[
                  { value: 'fit', label: en['orientation.fit'] },
                  { value: 'crop', label: en['orientation.crop'] },
                ]}
              />
            </section>
          )}

          <Callout
            title={file === undefined ? en['install.title'] : en['entryWeb.more.title']}
            action={
              <Button variant="outline" onClick={onInstall}>
                {file === undefined ? en['install.cta'] : en['entryWeb.more.cta']}
              </Button>
            }
          >
            {file === undefined ? en['install.body'] : en['entryWeb.more.body']}
          </Callout>
        </div>
      </div>

      <div className="pr-screen__footer">
        {/* Disabled rather than hidden: the user should be able to see what
            happens next before they have chosen anything. */}
        <Button variant="primary" onClick={onContinue} disabled={file === undefined}>
          {en['action.continue']}
        </Button>
      </div>
    </div>
  );
}
