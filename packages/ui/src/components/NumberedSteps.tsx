import type { ReactNode } from 'react';

export interface NumberedStepsProps {
  readonly steps: readonly ReactNode[];
  /** Locale for the step numerals, so they are not hardcoded Latin digits. */
  readonly locale?: string;
}

/**
 * The 01, 02, 03 explainer list.
 *
 * Rendered as an ordered list rather than styled divs, so a screen reader
 * announces it as a sequence of three. The visible numerals are decorative
 * duplicates of that structure and are hidden from assistive technology.
 */
export function NumberedSteps({ steps, locale = 'en' }: NumberedStepsProps) {
  const numeral = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 });
  return (
    <ol className="pr-steps">
      {steps.map((step, index) => (
        // Index as key is correct here rather than lazy: the list is static
        // copy that never reorders, and its position is the meaning.
        <li className="pr-steps__item" key={index}>
          <span className="pr-steps__number pr-numeric" aria-hidden="true">
            {numeral.format(index + 1)}
          </span>
          <span className="pr-steps__body">{step}</span>
        </li>
      ))}
    </ol>
  );
}
