import { ResultScreen } from './screens/ResultScreen.js';
import beforeImage from './assets/sample-fabric-degraded.jpg';
import afterImage from './assets/sample-fabric-prepared.jpg';

/**
 * Stage 5 harness.
 *
 * There is no router and no state library yet, so this renders the one screen
 * that exists against sample data. The figures below are the design's own, kept
 * so the screen can be compared against the render in design/screens.
 *
 * The two images are the design's mock photography. The "degraded" one is an
 * illustration of what the image pipeline does, drawn by the designer. It is
 * not measured output, and it gets replaced with real returned media once
 * /experiments/results.md exists.
 */
export function App() {
  return (
    <ResultScreen
      before={{ width: 720, height: 1280, bytes: 214 * 1024 }}
      after={{
        width: 1080,
        height: 1920,
        bytes: Math.round(1.9 * 1024 * 1024),
        durationSeconds: 6,
      }}
      presetName="Balanced"
      beforeImageSrc={beforeImage}
      afterImageSrc={afterImage}
      onBack={() => undefined}
      onExport={() => undefined}
      onWhy={() => undefined}
    />
  );
}
