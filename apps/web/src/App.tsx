import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PresetName } from '@pristine/encoder';
import { STATUS_FRAME } from '@pristine/encoder';
import { en } from '@pristine/copy';
import {
  OfflineBanner,
  OfflineIcon,
  formatBytes,
  formatDuration,
  type LibraryItem,
} from '@pristine/ui';
import { useNavigation } from './navigation.js';
import { useIsDesktop } from './useMediaQuery.js';
import { useMediaPicker } from './useMediaPicker.js';
import { useStore } from './useStore.js';
import { isAvailable, putItem } from './storage/db.js';
import type { MediaRejection } from './media.js';
import { SheetHost, type SheetName } from './sheets.js';
import { DesktopFirstRunScreen } from './screens/DesktopFirstRunScreen.js';
import { DesktopLibraryScreen } from './screens/DesktopLibraryScreen.js';
import { EducationScreen } from './screens/EducationScreen.js';
import { EntryScreen } from './screens/EntryScreen.js';
import { ExportScreen } from './screens/ExportScreen.js';
import { FirstRunScreen } from './screens/FirstRunScreen.js';
import { LibraryScreen } from './screens/LibraryScreen.js';
import { PermissionScreen } from './screens/PermissionScreen.js';
import { PresetScreen } from './screens/PresetScreen.js';
import { ProcessingScreen } from './screens/ProcessingScreen.js';
import { ResultScreen } from './screens/ResultScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { SplitScreen } from './screens/SplitScreen.js';
import beforeImage from './assets/sample-fabric-degraded.jpg';
import afterImage from './assets/sample-fabric-prepared.jpg';

/**
 * The flow, wired against sample data.
 *
 * There is no encoder yet and no state library, so this holds the little state
 * the screens need and fakes the one thing that takes time. Every figure below
 * is the design's own, kept so each screen can be compared against the renders
 * in design/screens.
 *
 * The comparison images are the design's mock photography. The degraded one is
 * an illustration of what the image pipeline does, drawn by the designer, not
 * measured output. Both get replaced with real returned media once
 * /experiments/results.md exists.
 */

const MB = 1024 * 1024;

/** Maps a rejected file to the sheet that explains it and offers a way on. */
const REJECTION_SHEET: Readonly<Record<MediaRejection, SheetName>> = {
  'too-large': 'file-too-large',
  'unsupported-format': 'unsupported-format',
  'low-storage': 'low-storage',
};

const PREPARED = {
  width: STATUS_FRAME.width,
  height: STATUS_FRAME.height,
  bytes: Math.round(1.9 * MB),
  durationSeconds: 6,
};

/**
 * Placeholder library, shown only behind the `?screen=` review affordance.
 *
 * The design renders stay reviewable without six fake Ankara entries appearing
 * in a real user's library. A fresh profile gets the empty state, which was
 * built from `design/screens/pristine-14-library-empty.png` and was unreachable
 * until now.
 */
const SAMPLE_LIBRARY: readonly LibraryItem[] = [
  { id: '1', name: en['sample.library.1'], when: '2 days ago' },
  { id: '2', name: en['sample.library.2'], when: '2 days ago' },
  { id: '3', name: en['sample.library.3'], when: '5 days ago' },
  { id: '4', name: en['sample.library.4'], when: '1 week ago' },
  { id: '5', name: en['sample.library.5'], when: '1 week ago' },
  { id: '6', name: en['sample.library.6'], when: '2 weeks ago' },
].map((item, index) => ({
  ...item,
  src: index % 2 === 0 ? afterImage : beforeImage,
  meta: index % 2 === 0 ? '0:06 · 2.1 MB' : '0:06 · 1.9 MB',
}));

/** How long the faked encode takes, in ms. Replaced by the real pipeline. */
const FAKE_ENCODE_MS = 2600;

/**
 * "2 days ago", in the reader's own language.
 *
 * Intl rather than a hand-written ladder, so the phrasing and the pluralisation
 * come from the locale rather than from English assumptions.
 */
function relativeDay(timestamp: number, locale = 'en'): string {
  const days = Math.round((timestamp - Date.now()) / (24 * 60 * 60 * 1000));
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(days) >= 7) return formatter.format(Math.round(days / 7), 'week');
  return formatter.format(days, 'day');
}

/**
 * A preset's display name. The union member is an identifier, not copy, and
 * showing it raw puts a lowercase "balanced" in the interface.
 */
const PRESET_LABEL: Readonly<Record<PresetName, string>> = {
  max: en['preset.max.name'],
  balanced: en['preset.balanced.name'],
  saver: en['preset.saver.name'],
};

export function App() {
  const nav = useNavigation('first-run');
  const isDesktop = useIsDesktop();
  const store = useStore();
  const { settings, update } = store;
  const picker = useMediaPicker(settings.fit);

  /**
   * Whether to show the design's placeholder library.
   *
   * Only when a screen was requested by hand and nothing real is stored, so a
   * reviewer can still see the populated design without a real user ever
   * meeting fake entries.
   */
  const reviewing =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('screen');
  const showSamples = reviewing && store.items.length === 0;
  const [percent, setPercent] = useState(0);
  const [sheet, setSheet] = useState<SheetName | undefined>(undefined);
  const [offline, setOffline] = useState(false);

  const { screen, go, back, reset } = nav;

  // Mirrors the browser's own connectivity, so the banner is real rather than
  // a prop. It is the one piece of live state this harness has.
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // Drives the fake encode. Real progress arrives with the encoder, which is
  // why this lives here rather than inside ProcessingScreen.
  useEffect(() => {
    if (screen !== 'processing') return undefined;
    setPercent(0);
    const started = Date.now();
    const timer = window.setInterval(() => {
      const done = Math.min(1, (Date.now() - started) / FAKE_ENCODE_MS);
      setPercent(done * 100);
      if (done >= 1) {
        window.clearInterval(timer);
        go('result');
      }
    }, 40);
    return () => window.clearInterval(timer);
  }, [screen, go]);

  const closeSheet = useCallback(() => setSheet(undefined), []);
  const openPlan = useCallback(() => setSheet('plan'), []);

  /**
   * Keeps what was prepared, so the library is real.
   *
   * The stored blob is the Status render, which is genuinely what this stage
   * produces. It is not an encoded clip: that arrives with the pipeline in B1,
   * and this is the honest artefact until then.
   *
   * The original is kept alongside it so the user can re-prepare at another
   * quality without picking the file again, and pruned once the retention
   * window passes.
   */
  const keepResult = useCallback(async () => {
    const picked = picker.picked;
    if (picked === undefined || !isAvailable()) return;
    try {
      const prepared = await (await fetch(picked.renderUrl)).blob();
      await putItem({
        id: `${Date.now()}-${picked.media.file.name}`,
        name: picked.media.file.name,
        createdAt: Date.now(),
        width: STATUS_FRAME.width,
        height: STATUS_FRAME.height,
        durationSeconds: PREPARED.durationSeconds,
        prepared,
        original: picked.media.file,
      });
      await store.refresh();
    } catch {
      // A full disk or a private window. The user still has the result on
      // screen and can save it, so this is not worth interrupting them for.
    }
  }, [picker.picked, store]);

  // A rejected file raises its sheet. These three were built with copy and were
  // unreachable until the picker was real.
  const { rejection, dismissRejection } = picker;
  useEffect(() => {
    if (rejection !== undefined) setSheet(REJECTION_SHEET[rejection]);
  }, [rejection]);

  /**
   * Stored records as the library grid wants them.
   *
   * Object URLs are minted per render and revoked on the next one, so a stored
   * blob never leaks a URL that outlives the screen showing it.
   */
  const libraryItems: LibraryItem[] = useMemo(
    () =>
      store.items.map((item) => ({
        id: item.id,
        src: URL.createObjectURL(item.prepared),
        name: item.name,
        meta: `${formatDuration(item.durationSeconds)} · ${formatBytes(item.prepared.size)}`,
        when: relativeDay(item.createdAt),
      })),
    [store.items],
  );

  useEffect(
    () => () => {
      for (const item of libraryItems) URL.revokeObjectURL(item.src);
    },
    [libraryItems],
  );

  const chosen = picker.picked?.chosen;
  // The Status render, once there is one. Falls back to the design's mock for
  // the first run hero, which has no file yet.
  const preview = picker.picked?.renderUrl ?? afterImage;

  const screenElement = (() => {
    switch (screen) {
      case 'education':
        return <EducationScreen onDismiss={back} />;

      case 'permission':
        return <PermissionScreen onAccept={() => go('entry')} onDecline={back} />;

      case 'entry':
        return (
          <EntryScreen
            file={chosen}
            thumbnailSrc={preview}
            fit={settings.fit}
            onFitChange={(fit) => update({ fit })}
            onBrowse={picker.browse}
            onBack={back}
            onContinue={() => go('preset')}
            onInstall={() => setSheet('android-only')}
          />
        );

      case 'preset':
        return (
          <PresetScreen
            selected={settings.preset}
            onSelect={(preset) => update({ preset })}
            lockedPresets={['max']}
            onBack={back}
            onPrepare={() => go('processing')}
            onSeePlans={openPlan}
          />
        );

      case 'processing':
        return <ProcessingScreen percent={percent} onCancel={back} />;

      case 'result':
        return (
          <ResultScreen
            before={{ width: 720, height: 1280, bytes: 214 * 1024 }}
            after={PREPARED}
            presetName={PRESET_LABEL[settings.preset]}
            beforeImageSrc={beforeImage}
            afterImageSrc={preview}
            onBack={() => reset('library')}
            onExport={() => go('export')}
            onWhy={() => go('education')}
          />
        );

      case 'export':
        return (
          <ExportScreen
            {...PREPARED}
            thumbnailSrc={afterImage}
            onBack={back}
            onShareToStatus={() => {
              void keepResult();
              reset('library');
            }}
            onSendAsDocument={() => {
              void keepResult();
              reset('library');
            }}
            onSaveToDevice={() => {
              void keepResult();
              reset('library');
            }}
          />
        );

      case 'split':
        return (
          <SplitScreen
            durationSeconds={88}
            frames={[afterImage, beforeImage, afterImage, beforeImage, afterImage]}
            maxFreeParts={2}
            onBack={back}
            onPrepare={() => go('processing')}
            onSeePlans={openPlan}
          />
        );

      // First run and library are the only two screens the brief allows a
      // desktop variant for. Everything else keeps the phone layout at every
      // width, because the phone is the product.
      case 'library':
        if (isDesktop) {
          return (
            <DesktopLibraryScreen
              items={showSamples ? SAMPLE_LIBRARY : libraryItems}
              preparedBytes={store.usage.preparedBytes}
              originalsBytes={store.usage.originalsBytes}
              freeBytes={store.usage.freeBytes}
              onReshare={() => setSheet('library-item')}
              onFreeUpSpace={() => setSheet('free-up-space')}
              onSettings={() => go('settings')}
              onPrepare={() => reset('entry')}
            />
          );
        }
        return (
          <LibraryScreen
            items={showSamples ? SAMPLE_LIBRARY : libraryItems}
            preparedBytes={store.usage.preparedBytes}
            originalsBytes={store.usage.originalsBytes}
            freeBytes={store.usage.freeBytes}
            onOpenItem={() => setSheet('library-item')}
            onFreeUpSpace={() => setSheet('free-up-space')}
            onSettings={() => go('settings')}
            onPrepare={() => reset('entry')}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            defaultPreset={PRESET_LABEL[settings.preset]}
            fit={settings.fit}
            clipsEnabled={settings.clips}
            onClipsChange={(clips) => update({ clips })}
            keepOriginalsDays={settings.keepOriginalsDays}
            usedBytes={store.usage.preparedBytes + store.usage.originalsBytes}
            language={en['language.english']}
            version="1.0.0"
            onBack={back}
            onEditPreset={() => go('preset')}
            onEditFit={() => go('entry')}
            onRetentionChange={(keepOriginalsDays) => update({ keepOriginalsDays })}
            onEditRetention={() => setSheet('free-up-space')}
            onFreeUpSpace={() => setSheet('free-up-space')}
            onEditLanguage={() => undefined}
            onOpenPlan={openPlan}
          />
        );

      case 'first-run':
      default:
        if (isDesktop) {
          return (
            <DesktopFirstRunScreen
              beforeImageSrc={beforeImage}
              afterImageSrc={afterImage}
              before={{ width: 720, height: 1280, bytes: 214 * 1024 }}
              after={PREPARED}
              onPick={() => go('entry')}
              onExplain={() => go('education')}
              onLibrary={() => go('library')}
              onInstall={() => setSheet('android-only')}
            />
          );
        }
        return (
          <FirstRunScreen
            beforeImageSrc={beforeImage}
            afterImageSrc={afterImage}
            onPick={() => go('permission')}
            onExplain={() => go('education')}
          />
        );
    }
  })();

  return (
    <>
      {offline && (
        <div className="pr-screen__banner">
          <OfflineBanner
            icon={<OfflineIcon />}
            title={en['offline.title']}
            body={en['offline.body']}
          />
        </div>
      )}
      {screenElement}
      <input {...picker.inputProps} />
      <SheetHost
        sheet={sheet}
        onClose={() => {
          dismissRejection();
          closeSheet();
        }}
        fileBytes={chosen?.bytes ?? 0}
        // Preparing holds the original and the render at once, which is the
        // same rule readPickedFile rejects on. Stating a different number in
        // the sheet than the one that triggered it would be its own bug.
        neededBytes={(chosen?.bytes ?? 0) * 2}
        availableBytes={store.usage.freeBytes ?? 0}
        reclaimableBytes={store.reclaimable}
        onUseDataSaver={() => {
          // Persisted, not just applied. Choosing the fallback after a failed
          // encode is a preference, and it should still hold next time.
          update({ preset: 'saver' });
          closeSheet();
        }}
        onRetry={() => {
          closeSheet();
          go('processing');
        }}
        onChooseAnother={() => {
          picker.clear();
          dismissRejection();
          closeSheet();
          reset('entry');
          picker.browse();
        }}
        onInstall={closeSheet}
      />
    </>
  );
}
