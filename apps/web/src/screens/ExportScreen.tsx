import { en, format } from '@pristine/copy';
import {
  AppBar,
  DestinationButton,
  DocumentIcon,
  MediaSummary,
  PrimaryDestination,
  SaveIcon,
  formatBytes,
  formatDuration,
} from '@pristine/ui';

export interface ExportScreenProps {
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
  readonly durationSeconds: number;
  readonly thumbnailSrc: string;
  readonly onBack: () => void;
  readonly onShareToStatus: () => void;
  readonly onSendAsDocument: () => void;
  readonly onSaveToDevice: () => void;
}

/**
 * Where the prepared media goes.
 *
 * Status is the primary path and the only one that is a filled button. The
 * other two are real alternatives with their trade stated, not hidden options:
 * the document path avoids re-encoding entirely but lands in a chat rather
 * than on Status, which is a genuine choice rather than a worse version of the
 * same thing.
 */
export function ExportScreen({
  width,
  height,
  bytes,
  durationSeconds,
  thumbnailSrc,
  onBack,
  onShareToStatus,
  onSendAsDocument,
  onSaveToDevice,
}: ExportScreenProps) {
  return (
    <div className="pr-screen">
      <AppBar title={en['export.title']} onBack={onBack} />

      <div className="pr-screen__scroll">
        <MediaSummary
          variant="bare"
          thumbnailSrc={thumbnailSrc}
          title={en['export.ready']}
          meta={format('format.clipMeta', {
            width,
            height,
            size: formatBytes(bytes),
            duration: formatDuration(durationSeconds),
          })}
        />

        <h2 className="pr-eyebrow pr-eyebrow--muted">{en['export.otherWays']}</h2>

        <div className="pr-screen__stack pr-screen__stack--tight">
          <DestinationButton
            icon={<DocumentIcon />}
            title={en['export.document.title']}
            description={en['export.document.body']}
            onClick={onSendAsDocument}
          />
          <DestinationButton
            variant="bare"
            icon={<SaveIcon />}
            title={en['export.save.title']}
            description={en['export.save.body']}
            onClick={onSaveToDevice}
          />
        </div>
      </div>

      <div className="pr-screen__footer">
        <PrimaryDestination
          title={en['export.status.title']}
          subtitle={format('export.status.body', { width, height })}
          onClick={onShareToStatus}
        />
      </div>
    </div>
  );
}
