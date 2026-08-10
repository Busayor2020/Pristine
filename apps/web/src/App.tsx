import { useCallback, useEffect, useState } from 'react';
import type { FitMode, PresetName } from '@pristine/encoder';
import { STATUS_FRAME } from '@pristine/encoder';
import { en } from '@pristine/copy';
import { useNavigation } from './navigation.js';
import { EducationScreen } from './screens/EducationScreen.js';
import { EntryScreen, type ChosenFile } from './screens/EntryScreen.js';
import { ExportScreen } from './screens/ExportScreen.js';
import { FirstRunScreen } from './screens/FirstRunScreen.js';
import { PresetScreen } from './screens/PresetScreen.js';
import { ProcessingScreen } from './screens/ProcessingScreen.js';
import { ResultScreen } from './screens/ResultScreen.js';
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

const SAMPLE_FILE: ChosenFile = {
  name: 'IMG_20260809_1432.jpg',
  width: 4032,
  height: 3024,
  size: '3.8 MB',
};

const PREPARED = {
  width: STATUS_FRAME.width,
  height: STATUS_FRAME.height,
  bytes: Math.round(1.9 * 1024 * 1024),
  durationSeconds: 6,
};

/** How long the faked encode takes, in ms. Replaced by the real pipeline. */
const FAKE_ENCODE_MS = 2600;

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
  const [file, setFile] = useState<ChosenFile | undefined>(undefined);
  const [fit, setFit] = useState<FitMode>('fit');
  const [preset, setPreset] = useState<PresetName>('balanced');
  const [percent, setPercent] = useState(0);

  const { screen, go, back, reset } = nav;

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

  const chooseFile = useCallback(() => setFile(SAMPLE_FILE), []);

  switch (screen) {
    case 'education':
      return <EducationScreen onDismiss={back} />;

    case 'entry':
      return (
        <EntryScreen
          file={file}
          thumbnailSrc={afterImage}
          fit={fit}
          onFitChange={setFit}
          onBrowse={chooseFile}
          onBack={back}
          onContinue={() => go('preset')}
          onInstall={() => undefined}
        />
      );

    case 'preset':
      return (
        <PresetScreen
          selected={preset}
          onSelect={setPreset}
          lockedPresets={['max']}
          onBack={back}
          onPrepare={() => go('processing')}
          onSeePlans={() => undefined}
        />
      );

    case 'processing':
      return <ProcessingScreen percent={percent} onCancel={back} />;

    case 'result':
      return (
        <ResultScreen
          before={{ width: 720, height: 1280, bytes: 214 * 1024 }}
          after={PREPARED}
          presetName={PRESET_LABEL[preset]}
          beforeImageSrc={beforeImage}
          afterImageSrc={afterImage}
          onBack={() => reset('entry')}
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
          onShareToStatus={() => undefined}
          onSendAsDocument={() => undefined}
          onSaveToDevice={() => undefined}
        />
      );

    case 'first-run':
    default:
      return (
        <FirstRunScreen
          beforeImageSrc={beforeImage}
          afterImageSrc={afterImage}
          onPick={() => go('entry')}
          onExplain={() => go('education')}
        />
      );
  }
}
