/**
 * The local store.
 *
 * IndexedDB rather than localStorage, because prepared media is blobs and
 * localStorage holds strings with a few megabytes of headroom. Encoding a 2MB
 * clip as base64 would inflate it by a third and then hit the quota anyway.
 *
 * Deliberately not in `packages/encoder`. The pipeline should not know whether
 * anything is being kept, and it has to run in a worker and in Node where
 * IndexedDB may not exist at all.
 *
 * Hand-rolled over the raw API rather than pulling in a wrapper. The whole
 * surface is two stores and half a dozen operations, and this audience pays for
 * every kilobyte of the bundle.
 */

const DB_NAME = 'pristine';
const DB_VERSION = 1;

/** Prepared media the user can post again without redoing the work. */
export const ITEMS = 'items';
/** One row per setting, keyed by name. */
export const SETTINGS = 'settings';

export interface StoredItem {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly width: number;
  readonly height: number;
  readonly durationSeconds: number;
  /** The prepared result. */
  readonly prepared: Blob;
  /**
   * The source, kept so the user can re-prepare at another quality without
   * picking the file again. Deleted once it passes the retention window, which
   * is what the storage screen means by "originals".
   */
  readonly original?: Blob | undefined;
}

let open: Promise<IDBDatabase> | undefined;

/** True when this browser can store anything at all. */
export function isAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function connect(): Promise<IDBDatabase> {
  if (open !== undefined) return open;

  open = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ITEMS)) {
        const items = db.createObjectStore(ITEMS, { keyPath: 'id' });
        // Retention deletes by age, so the index it needs exists from the start.
        items.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(SETTINGS)) {
        db.createObjectStore(SETTINGS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('could not open the database'));
    // Another tab is holding an older version open. Failing loudly beats
    // hanging on a promise that will never settle.
    request.onblocked = () => reject(new Error('another tab is holding the database open'));
  });

  return open;
}

/** Runs one transaction and resolves when it commits, not when the request does. */
async function transact<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await connect();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = run(tx.objectStore(store));
    let result: T;
    request.onsuccess = () => {
      result = request.result;
    };
    // Waiting for the transaction rather than the request matters on write:
    // a request can succeed and the transaction still abort on quota.
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error ?? new Error('the transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('the transaction was aborted'));
  });
}

export const putItem = (item: StoredItem): Promise<IDBValidKey> =>
  transact(ITEMS, 'readwrite', (store) => store.put(item));

export const allItems = (): Promise<StoredItem[]> =>
  transact<StoredItem[]>(ITEMS, 'readonly', (store) => store.getAll());

export const deleteItem = (id: string): Promise<undefined> =>
  transact(ITEMS, 'readwrite', (store) => store.delete(id));

export const readSetting = <T>(key: string): Promise<T | undefined> =>
  transact<T | undefined>(SETTINGS, 'readonly', (store) => store.get(key));

export const writeSetting = <T>(key: string, value: T): Promise<IDBValidKey> =>
  transact(SETTINGS, 'readwrite', (store) => store.put(value, key));

/** Drops everything. Used by the tests and by a full reset. */
export async function clearAll(): Promise<void> {
  await transact(ITEMS, 'readwrite', (store) => store.clear());
  await transact(SETTINGS, 'readwrite', (store) => store.clear());
}

/** Forgets the cached connection, so the next call reopens. */
export function reset(): void {
  open = undefined;
}
