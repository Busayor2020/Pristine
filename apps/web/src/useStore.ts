import { useCallback, useEffect, useRef, useState } from 'react';
import { allItems, isAvailable, type StoredItem } from './storage/db.js';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from './storage/settings.js';
import {
  EMPTY_USAGE,
  forgetItem,
  pruneOriginals,
  readUsage,
  reclaimableBytes,
  type Usage,
} from './storage/usage.js';

/**
 * The app's persisted state.
 *
 * Settings and the library both come from IndexedDB, which is asynchronous, so
 * there is a moment before anything is loaded. `ready` exists so a screen can
 * tell "no items yet" apart from "not read yet": showing the empty library for
 * a frame before six items appear would be a flash of the wrong answer.
 */
export interface Store {
  readonly ready: boolean;
  readonly settings: Settings;
  readonly items: readonly StoredItem[];
  readonly usage: Usage;
  /** Bytes that deleting expired originals would recover. */
  readonly reclaimable: number;
  readonly update: (patch: Partial<Settings>) => void;
  readonly refresh: () => Promise<void>;
  readonly remove: (id: string) => Promise<void>;
  readonly freeUpSpace: () => Promise<void>;
}

export function useStore(): Store {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [items, setItems] = useState<readonly StoredItem[]>([]);
  const [usage, setUsage] = useState<Usage>(EMPTY_USAGE);
  // Guards against a settings write on the very first render overwriting what
  // was just read back off disk with the defaults.
  const loaded = useRef(false);

  const refresh = useCallback(async () => {
    if (!isAvailable()) return;
    const [stored, next] = await Promise.all([allItems(), readUsage()]);
    setItems(stored.sort((a, b) => b.createdAt - a.createdAt));
    setUsage(next);
  }, []);

  useEffect(() => {
    void (async () => {
      const stored = await loadSettings();
      setSettings(stored);
      // Retention is enforced on open rather than by a timer. There is no
      // background process in a web app, and this is the moment the window is
      // known to have passed.
      if (isAvailable()) {
        try {
          await pruneOriginals(stored.keepOriginalsDays);
        } catch {
          // Pruning is housekeeping. Failing it should not stop the app opening.
        }
      }
      await refresh();
      loaded.current = true;
      setReady(true);
    })();
  }, [refresh]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      if (loaded.current) void saveSettings(next);
      return next;
    });
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await forgetItem(id);
      await refresh();
    },
    [refresh],
  );

  const freeUpSpace = useCallback(async () => {
    await pruneOriginals(settings.keepOriginalsDays);
    await refresh();
  }, [refresh, settings.keepOriginalsDays]);

  return {
    ready,
    settings,
    items,
    usage,
    reclaimable: reclaimableBytes(items, settings.keepOriginalsDays),
    update,
    refresh,
    remove,
    freeUpSpace,
  };
}
