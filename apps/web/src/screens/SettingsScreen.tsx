import type { FitMode, PresetName } from '@pristine/encoder';
import { en, format } from '@pristine/copy';
import { AppBar, SettingsGroup, SettingsRow, ToggleRow, Wordmark, formatBytes } from '@pristine/ui';

export interface SettingsScreenProps {
  readonly defaultPreset: string;
  readonly fit: FitMode;
  readonly clipsEnabled: boolean;
  readonly onClipsChange: (enabled: boolean) => void;
  readonly keepOriginalsDays: number;
  readonly usedBytes: number;
  readonly language: string;
  readonly version: string;
  readonly onBack: () => void;
  readonly onEditPreset: () => void;
  readonly onEditFit: () => void;
  readonly onEditRetention: () => void;
  readonly onFreeUpSpace: () => void;
  readonly onEditLanguage: () => void;
  readonly onOpenPlan: () => void;
}

/**
 * Settings.
 *
 * The clips toggle is the one that matters: it turns off the technique the
 * whole product is built on. It stays a plain switch with the trade stated,
 * not a hidden advanced option, because a user who dislikes getting a video
 * back should be able to say so without hunting.
 */
export function SettingsScreen(props: SettingsScreenProps) {
  const {
    defaultPreset,
    fit,
    clipsEnabled,
    onClipsChange,
    keepOriginalsDays,
    usedBytes,
    language,
    version,
    onBack,
    onEditPreset,
    onEditFit,
    onEditRetention,
    onFreeUpSpace,
    onEditLanguage,
    onOpenPlan,
  } = props;

  return (
    <div className="pr-screen">
      <AppBar title={en['settings.title']} onBack={onBack} />

      <div className="pr-screen__scroll">
        <SettingsGroup label={en['settings.section.quality']}>
          <SettingsRow
            title={en['settings.defaultQuality']}
            value={defaultPreset}
            onClick={onEditPreset}
          />
        </SettingsGroup>

        <SettingsGroup label={en['settings.section.media']}>
          <SettingsRow
            title={en['settings.orientation']}
            value={fit === 'fit' ? en['orientation.fit'] : en['orientation.crop']}
            onClick={onEditFit}
          />
          <ToggleRow
            title={en['settings.clips']}
            description={en['settings.clipsBody']}
            checked={clipsEnabled}
            onChange={onClipsChange}
          />
        </SettingsGroup>

        <SettingsGroup label={en['settings.section.storage']}>
          <SettingsRow
            title={en['settings.keepOriginals']}
            value={format('settings.keepOriginalsValue', { days: keepOriginalsDays })}
            numericValue
            onClick={onEditRetention}
          />
          <SettingsRow
            title={en['action.freeUpSpace']}
            value={format('settings.storageUsed', { size: formatBytes(usedBytes) })}
            numericValue
            onClick={onFreeUpSpace}
          />
        </SettingsGroup>

        <SettingsGroup label={en['settings.section.language']}>
          <SettingsRow
            title={en['settings.appLanguage']}
            value={language}
            onClick={onEditLanguage}
          />
        </SettingsGroup>

        <SettingsGroup label={en['settings.section.plan']}>
          <SettingsRow
            title={en['settings.planFree']}
            description={en['settings.planFreeBody']}
            onClick={onOpenPlan}
          />
        </SettingsGroup>

        <div className="pr-settings__version">
          <Wordmark name={en['app.name']} />
          <span className="pr-numeric">{format('app.version', { version })}</span>
        </div>
      </div>
    </div>
  );
}

/** The preset names, so settings can show the current one as copy. */
export const PRESET_LABELS: Readonly<Record<PresetName, string>> = {
  max: en['preset.max.name'],
  balanced: en['preset.balanced.name'],
  saver: en['preset.saver.name'],
};
