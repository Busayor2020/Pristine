import type { PresetName } from '@pristine/encoder';
import { STATUS_FRAME, estimateUploadSeconds } from '@pristine/encoder';
import { en, format } from '@pristine/copy';
import { AppBar, Button, Callout, OptionCard, formatBytes, formatDuration } from '@pristine/ui';

/**
 * Estimated output size per tier, in bytes.
 *
 * UNVERIFIED, and taken from the design's own figures rather than computed
 * from an encoder setting, because no encoder setting is measured yet. These
 * exist so the screen can show a real trade rather than a placeholder. They
 * are replaced from results.md in stage 4, at which point they should be
 * derived from the preset rather than listed here.
 */
const ESTIMATED_BYTES: Readonly<Record<PresetName, number>> = {
  max: Math.round(4.2 * 1024 * 1024),
  balanced: Math.round(1.9 * 1024 * 1024),
  saver: Math.round(0.9 * 1024 * 1024),
};

export interface PresetScreenProps {
  readonly selected: PresetName;
  readonly onSelect: (preset: PresetName) => void;
  /** Tiers the current plan does not include. */
  readonly lockedPresets?: readonly PresetName[];
  readonly onBack: () => void;
  readonly onPrepare: () => void;
  readonly onSeePlans: () => void;
}

/**
 * Choosing how much detail to keep.
 *
 * The screen exists to make a trade legible, so every tier states its size and
 * its upload time rather than a vague quality word. Data cost is the deciding
 * factor for this audience far more often than sharpness is.
 */
export function PresetScreen({
  selected,
  onSelect,
  lockedPresets = [],
  onBack,
  onPrepare,
  onSeePlans,
}: PresetScreenProps) {
  const describe = (preset: PresetName): string =>
    format('preset.meta', {
      width: STATUS_FRAME.width,
      height: STATUS_FRAME.height,
      // Forced to MB so the three tiers can be compared without unit conversion.
      size: formatBytes(ESTIMATED_BYTES[preset], { unit: 'MB' }),
      time: formatDuration(estimateUploadSeconds(ESTIMATED_BYTES[preset])),
    });

  return (
    <div className="pr-screen">
      <AppBar title={en['preset.title']} onBack={onBack} />

      <div className="pr-screen__scroll">
        <h1 className="pr-heading">{en['preset.question']}</h1>
        <p className="pr-lead pr-lead--small">{en['preset.body']}</p>

        <div className="pr-screen__stack pr-screen__stack--tight">
          <OptionCard
            name={en['preset.max.name']}
            meta={describe('max')}
            description={en['preset.max.body']}
            selected={selected === 'max'}
            onSelect={() => onSelect('max')}
            badge={en['badge.pro']}
            badgeTone="pro"
          />
          <OptionCard
            name={en['preset.balanced.name']}
            meta={describe('balanced')}
            description={en['preset.balanced.body']}
            selected={selected === 'balanced'}
            onSelect={() => onSelect('balanced')}
            badge={en['badge.recommended']}
          />
          <OptionCard
            name={en['preset.saver.name']}
            meta={describe('saver')}
            description={en['preset.saver.body']}
            selected={selected === 'saver'}
            onSelect={() => onSelect('saver')}
          />

          {lockedPresets.length > 0 && (
            <Callout
              inlineAction
              action={
                <Button variant="inline" onClick={onSeePlans}>
                  {en['action.seePlans']}
                </Button>
              }
            >
              {en['preset.planNote']}
            </Callout>
          )}
        </div>
      </div>

      <div className="pr-screen__footer">
        <Button variant="primary" onClick={onPrepare}>
          {en['preset.cta']}
        </Button>
      </div>
    </div>
  );
}
