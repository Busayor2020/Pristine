import { en, format } from '@pristine/copy';
import {
  Button,
  LibraryGrid,
  PlusIcon,
  SettingsIcon,
  StorageMeter,
  Wordmark,
  formatBytes,
  type LibraryItem,
} from '@pristine/ui';

export interface LibraryScreenProps {
  readonly items: readonly LibraryItem[];
  readonly preparedBytes: number;
  readonly originalsBytes: number;
  readonly freeBytes: number;
  readonly onOpenItem: (id: string) => void;
  readonly onFreeUpSpace: () => void;
  readonly onSettings: () => void;
  readonly onPrepare: () => void;
}

/**
 * What has been prepared, and what it costs in storage.
 *
 * Storage is given as much room as the grid because the target device is
 * short of it. A user who cannot tell what Pristine is holding will uninstall
 * rather than go looking for a setting.
 */
export function LibraryScreen({
  items,
  preparedBytes,
  originalsBytes,
  freeBytes,
  onOpenItem,
  onFreeUpSpace,
  onSettings,
  onPrepare,
}: LibraryScreenProps) {
  const used = preparedBytes + originalsBytes;
  const total = used + freeBytes;

  if (items.length === 0) {
    return (
      <div className="pr-screen">
        <LibraryHeader onSettings={onSettings} />
        <div className="pr-empty">
          <div className="pr-empty__art" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <h1 className="pr-empty__title">{en['libraryEmpty.title']}</h1>
          <p className="pr-empty__body">{en['libraryEmpty.body']}</p>
        </div>
        <div className="pr-screen__footer">
          <Button variant="primary" onClick={onPrepare}>
            {en['libraryEmpty.cta']}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-screen">
      <LibraryHeader onSettings={onSettings} />

      <div className="pr-screen__scroll">
        <StorageMeter
          headline={format('library.usage', { size: formatBytes(used) })}
          free={format('library.free', { size: formatBytes(freeBytes) })}
          segments={[
            {
              label: en['library.prepared'],
              value: formatBytes(preparedBytes),
              fraction: preparedBytes / total,
              tone: 'used',
            },
            {
              label: en['library.originals'],
              value: formatBytes(originalsBytes),
              fraction: originalsBytes / total,
              tone: 'secondary',
            },
          ]}
        />

        <div className="pr-screen__stack">
          <Button variant="outline" className="pr-button--block" onClick={onFreeUpSpace}>
            {en['action.freeUpSpace']}
          </Button>
        </div>

        <div className="pr-library__header">
          <h2 className="pr-eyebrow pr-eyebrow--muted pr-eyebrow--inline">
            {en['library.sectionPrepared']}
          </h2>
          <span className="pr-library__count pr-numeric">
            {format('library.count', { count: items.length })}
          </span>
        </div>

        <LibraryGrid items={items} onOpen={onOpenItem} />
      </div>

      <div className="pr-screen__footer">
        <Button variant="primary" onClick={onPrepare}>
          <PlusIcon />
          {en['library.cta']}
        </Button>
      </div>
    </div>
  );
}

function LibraryHeader({ onSettings }: { readonly onSettings: () => void }) {
  return (
    <header className="pr-appbar">
      <Wordmark name={en['app.name']} />
      <button
        type="button"
        className="pr-appbar__back pr-appbar__trailing-button"
        onClick={onSettings}
        aria-label={en['settings.title']}
      >
        <SettingsIcon />
      </button>
    </header>
  );
}
