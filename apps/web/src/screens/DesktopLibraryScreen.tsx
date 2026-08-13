import { en, format } from '@pristine/copy';
import { Button, PlusIcon, Wordmark, formatBytes, type LibraryItem } from '@pristine/ui';

export interface DesktopLibraryScreenProps {
  readonly items: readonly LibraryItem[];
  readonly preparedBytes: number;
  readonly originalsBytes: number;
  /** Undefined where the browser will not report it. */
  readonly freeBytes?: number | undefined;
  readonly onReshare: (id: string) => void;
  readonly onFreeUpSpace: () => void;
  readonly onSettings: () => void;
  readonly onPrepare: () => void;
}

/**
 * Library, on a laptop.
 *
 * The second and last screen the brief allows a desktop variant for. A sidebar
 * carries navigation and the storage summary, so the grid gets the width.
 *
 * The design's sidebar also lists Batch and Brand kit. Both are seller mode,
 * which the brief puts in phase 2 and explicitly says not to scaffold for, so
 * they are absent rather than present and disabled. A greyed row is still an
 * interface for later.
 *
 * Each card gains a direct "Re-share" action. On a phone the whole card opens
 * a sheet because there is no room for anything else. Here there is room, and
 * re-sharing is the thing people came back for.
 */
export function DesktopLibraryScreen({
  items,
  preparedBytes,
  originalsBytes,
  freeBytes,
  onReshare,
  onFreeUpSpace,
  onSettings,
  onPrepare,
}: DesktopLibraryScreenProps) {
  const used = preparedBytes + originalsBytes;
  const total = freeBytes === undefined ? Math.max(used, 1) : used + freeBytes;

  return (
    <div className="pr-desktop pr-desktop--app">
      <aside className="pr-sidebar">
        <div className="pr-sidebar__mark">
          <Wordmark name={en['app.name']} />
        </div>

        <nav className="pr-sidebar__nav">
          <span className="pr-sidebar__item pr-sidebar__item--active" aria-current="page">
            <span className="pr-sidebar__dot" aria-hidden="true" />
            {en['desktop.nav.library']}
            <span className="pr-sidebar__count pr-numeric">{items.length}</span>
          </span>
          <button type="button" className="pr-sidebar__item" onClick={onSettings}>
            <span className="pr-sidebar__dot" aria-hidden="true" />
            {en['desktop.nav.settings']}
          </button>
        </nav>

        <div className="pr-sidebar__storage">
          <p className="pr-sidebar__using pr-numeric">
            {format('desktop.library.using', { size: formatBytes(used) })}
          </p>
          <div className="pr-storage__bar">
            <span
              className="pr-storage__segment pr-storage__segment--used"
              style={{ width: `${(preparedBytes / total) * 100}%` }}
            />
            <span
              className="pr-storage__segment pr-storage__segment--secondary"
              style={{ width: `${(originalsBytes / total) * 100}%` }}
            />
          </div>
          {freeBytes !== undefined && (
            <p className="pr-sidebar__free pr-numeric">
              {format('desktop.library.free', { size: formatBytes(freeBytes) })}
            </p>
          )}
          <Button variant="outline" className="pr-button--block" onClick={onFreeUpSpace}>
            {en['action.freeUpSpace']}
          </Button>
        </div>
      </aside>

      <div className="pr-desktop__main">
        <header className="pr-desktop__header">
          <h1 className="pr-desktop__title">{en['desktop.nav.library']}</h1>
          <p className="pr-desktop__meta pr-numeric">
            {format('desktop.library.meta', {
              count: items.length,
              size: formatBytes(preparedBytes),
            })}
          </p>
          <Button variant="primary" className="pr-desktop__cta" onClick={onPrepare}>
            <PlusIcon />
            {en['library.cta']}
          </Button>
        </header>

        <ul className="pr-grid">
          {items.map((item) => (
            <li key={item.id} className="pr-grid__cell">
              <article className="pr-card">
                <div className="pr-card__frame">
                  <img src={item.src} alt="" />
                  <span className="pr-card__meta pr-numeric">{item.meta}</span>
                </div>
                <div className="pr-card__footer">
                  <div className="pr-card__text">
                    <span className="pr-card__name">{item.name}</span>
                    <span className="pr-card__when pr-numeric">{item.when}</span>
                  </div>
                  <Button variant="inline" onClick={() => onReshare(item.id)}>
                    {en['desktop.library.reshare']}
                  </Button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
