import { CheckIcon } from './Icon.js';

export interface ProgressBarProps {
  /** 0 to 100. */
  readonly percent: number;
  readonly label: string;
}

/**
 * The percentage and bar.
 *
 * A real progressbar role with the value on it, because "Preparing" with no
 * number is exactly the spinner the brief rules out. Numerals are tabular so
 * the figure does not jitter as it counts.
 */
export function ProgressBar({ percent, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div className="pr-progress">
      <div className="pr-progress__readout">
        <span className="pr-progress__value pr-numeric">{clamped}</span>
        <span className="pr-progress__unit">%</span>
      </div>
      <div
        className="pr-progress__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="pr-progress__fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export interface Stage {
  readonly name: string;
  /** Shown once the stage has finished, for example how long it took. */
  readonly note?: string;
}

export interface StageListProps {
  readonly stages: readonly Stage[];
  /** Index of the stage currently running. Everything before it is done. */
  readonly activeIndex: number;
}

/**
 * The named stages.
 *
 * Named rather than generic, so a user watching a slow encode can see that
 * something specific is happening rather than wondering whether it has hung.
 */
export function StageList({ stages, activeIndex }: StageListProps) {
  return (
    <ol className="pr-stages">
      {stages.map((stage, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        const state = done ? 'done' : active ? 'active' : 'waiting';
        return (
          <li className={`pr-stages__item pr-stages__item--${state}`} key={stage.name}>
            <span className="pr-stages__marker" aria-hidden="true">
              {done && <CheckIcon size={11} />}
            </span>
            <span className="pr-stages__name">{stage.name}</span>
            {stage.note !== undefined && (
              <span className="pr-stages__note pr-numeric">{stage.note}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
