import type { FitMode, PresetName } from '@pristine/encoder';
import { isAvailable, readSetting, writeSetting } from './db.js';

/**
 * Preferences that outlive a reload.
 *
 * These were component state, so every one of them reset on refresh. The clips
 * toggle in particular is a real preference: a user who dislikes getting a
 * video back had to say so again every single time.
 */
export interface Settings {
  readonly preset: PresetName;
  readonly fit: FitMode;
  /** Whether photos are turned into clips at all. */
  readonly clips: boolean;
  readonly keepOriginalsDays: number;
  readonly language: string;
}

export const DEFAULT_SETTINGS: Settings = {
  // Matches the design, which marks Balanced as recommended.
  preset: 'balanced',
  // Letterbox keeps the whole photo, which is the safer default when we have
  // not asked.
  fit: 'fit',
  clips: true,
  keepOriginalsDays: 7,
  language: 'en',
};

const KEY = 'settings';

const PRESETS = new Set<PresetName>(['max', 'balanced', 'saver']);
const FITS = new Set<FitMode>(['fit', 'crop']);

/**
 * Rebuilds settings from whatever is on disk.
 *
 * Every field is validated rather than trusted. Stored data outlives the code
 * that wrote it: a preset removed in a later version, or a hand-edited value in
 * devtools, must not put the app into a state no screen can render.
 */
export function coerce(stored: unknown): Settings {
  if (typeof stored !== 'object' || stored === null) return DEFAULT_SETTINGS;
  const raw = stored as Partial<Record<keyof Settings, unknown>>;

  const days = Number(raw.keepOriginalsDays);
  return {
    preset: PRESETS.has(raw.preset as PresetName)
      ? (raw.preset as PresetName)
      : DEFAULT_SETTINGS.preset,
    fit: FITS.has(raw.fit as FitMode) ? (raw.fit as FitMode) : DEFAULT_SETTINGS.fit,
    clips: typeof raw.clips === 'boolean' ? raw.clips : DEFAULT_SETTINGS.clips,
    // Zero would mean deleting originals the instant they are written, which no
    // interface offers and nobody means.
    keepOriginalsDays:
      Number.isFinite(days) && days > 0 && days <= 365 ? days : DEFAULT_SETTINGS.keepOriginalsDays,
    language: typeof raw.language === 'string' ? raw.language : DEFAULT_SETTINGS.language,
  };
}

export async function loadSettings(): Promise<Settings> {
  if (!isAvailable()) return DEFAULT_SETTINGS;
  try {
    return coerce(await readSetting<unknown>(KEY));
  } catch {
    // A private window, a blocked origin, or a corrupt database. None of that
    // should stop the app opening; it just means preferences do not persist.
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (!isAvailable()) return;
  try {
    await writeSetting(KEY, settings);
  } catch {
    // Same reasoning. Losing a preference is not worth an error sheet.
  }
}
