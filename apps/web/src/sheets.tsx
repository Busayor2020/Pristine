import { en, format, templateParts } from '@pristine/copy';
import { unverifiedCopy } from '@pristine/copy/unverified';
import { Button, Sheet, formatBytes } from '@pristine/ui';

/**
 * Every sheet in the flow.
 *
 * Grouped in one module because they share a shape: a title, an explanation of
 * what happened in the user's terms, and at least one way forward. None of them
 * is a dead end, which is the rule that matters. "Processing failed" with an OK
 * button is a shrug, not an error message.
 *
 * The order of actions is deliberate throughout: the thing most likely to get
 * the user what they wanted comes first.
 */

export type SheetName =
  | 'encode-failed'
  | 'file-too-large'
  | 'unsupported-format'
  | 'low-storage'
  | 'android-only'
  | 'free-up-space'
  | 'library-item'
  | 'plan';

export interface SheetHostProps {
  readonly sheet: SheetName | undefined;
  readonly onClose: () => void;
  /** Sizes shown in the storage and file sheets. */
  readonly fileBytes: number;
  readonly neededBytes: number;
  readonly availableBytes: number;
  readonly reclaimableBytes: number;
  readonly onUseDataSaver: () => void;
  readonly onRetry: () => void;
  readonly onChooseAnother: () => void;
  readonly onInstall: () => void;
}

const size = (bytes: number) => formatBytes(bytes);

export function SheetHost(props: SheetHostProps) {
  const {
    sheet,
    onClose,
    fileBytes,
    neededBytes,
    availableBytes,
    reclaimableBytes,
    onUseDataSaver,
    onRetry,
    onChooseAnother,
    onInstall,
  } = props;

  /** Renders a copy string with its interpolated figures emphasised. */
  const withFigures = (key: Parameters<typeof templateParts>[0], values: Record<string, string>) =>
    templateParts(key).map((part, index) =>
      part.kind === 'text' ? (
        part.text
      ) : (
        <strong key={index}>{values[part.name] ?? `{${part.name}}`}</strong>
      ),
    );

  switch (sheet) {
    case 'encode-failed':
      return (
        <Sheet
          open
          onClose={onClose}
          title={en['sheet.failed.title']}
          actions={
            <>
              <Button variant="primary" onClick={onRetry}>
                {en['sheet.failed.retry']}
              </Button>
              <Button variant="outline" className="pr-button--block" onClick={onUseDataSaver}>
                {en['sheet.failed.fallback']}
              </Button>
            </>
          }
        >
          <p>
            {withFigures('sheet.failed.body', {
              width: String(1080),
              height: String(1920),
            })}
          </p>
          <p>{en['sheet.failed.hint']}</p>
        </Sheet>
      );

    case 'file-too-large':
      return (
        <Sheet
          open
          onClose={onClose}
          title={en['sheet.tooLarge.title']}
          actions={
            <>
              <Button variant="primary" onClick={onClose}>
                {en['sheet.tooLarge.split']}
              </Button>
              <Button variant="outline" className="pr-button--block" onClick={onChooseAnother}>
                {en['sheet.tooLarge.pick']}
              </Button>
            </>
          }
        >
          <p>
            {withFigures('sheet.tooLarge.body', {
              size: size(fileBytes),
              needed: size(neededBytes),
              available: size(availableBytes),
            })}
          </p>
        </Sheet>
      );

    case 'unsupported-format':
      return (
        <Sheet
          open
          onClose={onClose}
          title={en['sheet.unsupported.title']}
          actions={
            <>
              <Button variant="primary" onClick={onInstall}>
                {en['sheet.unsupported.install']}
              </Button>
              <Button variant="outline" className="pr-button--block" onClick={onChooseAnother}>
                {en['sheet.unsupported.other']}
              </Button>
            </>
          }
        >
          <p>{en['sheet.unsupported.body']}</p>
        </Sheet>
      );

    case 'low-storage':
      return (
        <Sheet
          open
          onClose={onClose}
          title={en['sheet.lowStorage.title']}
          actions={
            <>
              <Button variant="primary" onClick={onClose}>
                {en['action.freeUpSpace']}
              </Button>
              <Button variant="outline" className="pr-button--block" onClick={onUseDataSaver}>
                {format('sheet.lowStorage.saver', { size: size(neededBytes) })}
              </Button>
            </>
          }
        >
          <p>
            {withFigures('sheet.lowStorage.body', {
              needed: size(neededBytes),
              available: size(availableBytes),
              reclaimable: size(reclaimableBytes),
            })}
          </p>
        </Sheet>
      );

    case 'android-only':
      return (
        <Sheet
          open
          onClose={onClose}
          title={en['sheet.install.title']}
          actions={
            <>
              <Button variant="primary" onClick={onInstall}>
                {en['sheet.install.cta']}
              </Button>
              <Button variant="quiet" onClick={onClose}>
                {en['sheet.install.dismiss']}
              </Button>
            </>
          }
        >
          <p>{en['sheet.install.body']}</p>
          <p className="pr-sheet__facts pr-numeric">
            {format('sheet.install.size', { size: size(18 * 1024 * 1024) })} ·{' '}
            {en['sheet.install.offline']}
          </p>
        </Sheet>
      );

    case 'free-up-space': {
      const rows = [
        {
          title: format('sheet.freeUp.originals', { days: 7 }),
          body: en['sheet.freeUp.originalsBody'],
          value: size(reclaimableBytes),
        },
        {
          title: en['sheet.freeUp.cache'],
          body: en['sheet.freeUp.cacheBody'],
          value: size(62 * 1024 * 1024),
        },
        {
          title: en['sheet.freeUp.prepared'],
          body: en['sheet.freeUp.preparedBody'],
          value: size(268 * 1024 * 1024),
        },
      ];
      return (
        <Sheet
          open
          onClose={onClose}
          title={en['sheet.freeUp.title']}
          actions={
            <Button variant="primary" onClick={onClose}>
              {format('sheet.freeUp.cta', { size: size(206 * 1024 * 1024) })}
            </Button>
          }
        >
          <ul className="pr-reclaim">
            {rows.map((row) => (
              <li className="pr-reclaim__item" key={row.title}>
                <span className="pr-reclaim__text">
                  <span className="pr-reclaim__title">{row.title}</span>
                  <span className="pr-reclaim__body">{row.body}</span>
                </span>
                <span className="pr-reclaim__value pr-numeric">{row.value}</span>
              </li>
            ))}
          </ul>
        </Sheet>
      );
    }

    case 'library-item':
      return (
        <Sheet
          open
          onClose={onClose}
          hideTitle
          title={en['library.prepared']}
          actions={
            <>
              <Button variant="primary" onClick={onClose}>
                {en['sheet.item.postAgain']}
              </Button>
              <Button variant="outline" className="pr-button--block" onClick={onClose}>
                {en['action.saveToDevice']}
              </Button>
              <Button variant="quiet" onClick={onClose}>
                {format('sheet.item.delete', { size: size(fileBytes) })}
              </Button>
            </>
          }
        >
          <p className="pr-numeric">
            {format('format.libraryMeta', {
              width: 1080,
              height: 1920,
              size: size(fileBytes),
              when: '2 days ago',
            })}
          </p>
        </Sheet>
      );

    /**
     * Deliberately a placeholder. Plans, payments and pricing are out of scope,
     * and this sheet contains none of them: it exists so the gates elsewhere in
     * the flow have somewhere to point, which is exactly what the design says
     * it is for.
     */
    case 'plan':
      return (
        <Sheet
          open
          onClose={onClose}
          title={en['sheet.plan.title']}
          actions={
            <Button variant="primary" onClick={onClose}>
              {en['action.close']}
            </Button>
          }
        >
          <p className="pr-eyebrow">{en['sheet.plan.eyebrow']}</p>
          <p>{en['sheet.plan.body']}</p>
          <ul className="pr-plan">
            {[en['sheet.plan.item1'], en['sheet.plan.item2'], en['sheet.plan.item3']].map(
              (item) => (
                <li className="pr-plan__item" key={item}>
                  <span>{item}</span>
                  <span className="pr-plan__badge">{en['badge.paid']}</span>
                </li>
              ),
            )}
          </ul>
        </Sheet>
      );

    default:
      return null;
  }
}

/** The explainer the result screen links to, reachable from a sheet as well. */
export const WHY_THIS_WORKS = unverifiedCopy['result.why'];
