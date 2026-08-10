export interface LibraryItem {
  readonly id: string;
  readonly src: string;
  readonly name: string;
  readonly meta: string;
  readonly when: string;
}

export interface LibraryGridProps {
  readonly items: readonly LibraryItem[];
  readonly onOpen: (id: string) => void;
}

/** Two column grid of prepared media. */
export function LibraryGrid({ items, onOpen }: LibraryGridProps) {
  return (
    <ul className="pr-library">
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" className="pr-library__item" onClick={() => onOpen(item.id)}>
            <span className="pr-library__frame">
              <img src={item.src} alt="" />
              <span className="pr-library__meta pr-numeric">{item.meta}</span>
            </span>
            <span className="pr-library__caption">
              <span className="pr-library__name">{item.name}</span>
              <span className="pr-library__when pr-numeric">{item.when}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
