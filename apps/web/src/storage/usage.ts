import { allItems, deleteItem, isAvailable, putItem, type StoredItem } from './db.js';

/**
 * What Pristine is actually taking up.
 *
 * The screens used to be handed literals: 268 MB prepared, 144 MB of originals,
 * 1.2 GB free. The deployed app claimed 412 MB while really using about 700 KB,
 * all of it the service worker precache. A storage screen that invents its
 * numbers is worse than no storage screen, because the one thing a user comes
 * to it for is to decide what to delete.
 */

export interface Usage {
  /** Sum of prepared blobs. */
  readonly preparedBytes: number;
  /** Sum of kept originals. */
  readonly originalsBytes: number;
  /**
   * Free space, when the browser will say. Undefined is a real answer and has
   * to stay distinguishable from zero: Firefox and some WebViews omit quota,
   * and rendering NaN or a confident 0 B would be a lie.
   */
  readonly freeBytes: number | undefined;
  readonly itemCount: number;
}

export const EMPTY_USAGE: Usage = {
  preparedBytes: 0,
  originalsBytes: 0,
  freeBytes: undefined,
  itemCount: 0,
};

/** Free space according to the browser, or undefined where it will not say. */
export async function estimateFreeBytes(): Promise<number | undefined> {
  if (typeof navigator === 'undefined' || navigator.storage?.estimate === undefined) {
    return undefined;
  }
  try {
    const { quota, usage } = await navigator.storage.estimate();
    if (quota === undefined) return undefined;
    return Math.max(0, quota - (usage ?? 0));
  } catch {
    return undefined;
  }
}

/** Adds up what is stored, from the blobs themselves rather than a guess. */
export function sumUsage(items: readonly StoredItem[], freeBytes: number | undefined): Usage {
  let preparedBytes = 0;
  let originalsBytes = 0;
  for (const item of items) {
    preparedBytes += item.prepared.size;
    originalsBytes += item.original?.size ?? 0;
  }
  return { preparedBytes, originalsBytes, freeBytes, itemCount: items.length };
}

export async function readUsage(): Promise<Usage> {
  if (!isAvailable()) return EMPTY_USAGE;
  try {
    const [items, freeBytes] = await Promise.all([allItems(), estimateFreeBytes()]);
    return sumUsage(items, freeBytes);
  } catch {
    return EMPTY_USAGE;
  }
}

/** Items whose original has outlived the retention window. */
export function expiredOriginals(
  items: readonly StoredItem[],
  keepDays: number,
  now: number = Date.now(),
): StoredItem[] {
  const cutoff = now - keepDays * 24 * 60 * 60 * 1000;
  return items.filter((item) => item.original !== undefined && item.createdAt < cutoff);
}

/** How much deleting the expired originals would actually recover. */
export function reclaimableBytes(
  items: readonly StoredItem[],
  keepDays: number,
  now: number = Date.now(),
): number {
  return expiredOriginals(items, keepDays, now).reduce(
    (total, item) => total + (item.original?.size ?? 0),
    0,
  );
}

/**
 * Drops originals past the retention window, keeping the prepared result.
 *
 * This is what the retention setting has to actually do. Until now it was a
 * number on a screen that deleted nothing.
 */
export async function pruneOriginals(keepDays: number, now: number = Date.now()): Promise<number> {
  if (!isAvailable()) return 0;
  const items = await allItems();
  const expired = expiredOriginals(items, keepDays, now);

  for (const item of expired) {
    // The prepared result stays. Only the source is dropped, which is exactly
    // what "keep originals for 7 days" promises.
    await putItem({ ...item, original: undefined });
  }
  return expired.reduce((total, item) => total + (item.original?.size ?? 0), 0);
}

/** Deletes an item outright, prepared result included. */
export async function forgetItem(id: string): Promise<void> {
  if (!isAvailable()) return;
  await deleteItem(id);
}
