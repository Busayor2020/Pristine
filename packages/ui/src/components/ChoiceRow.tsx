export interface Choice<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface ChoiceRowProps<T extends string> {
  readonly choices: readonly Choice<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly legend: string;
}

/**
 * Two or three equal weight options side by side, for example fit against crop.
 *
 * A radiogroup rather than buttons, so the choice is announced as a choice and
 * arrow keys work. The legend names what is being chosen and is visually
 * hidden, since the surrounding copy already says it on screen.
 */
export function ChoiceRow<T extends string>({
  choices,
  value,
  onChange,
  legend,
}: ChoiceRowProps<T>) {
  return (
    <fieldset className="pr-choices">
      <legend className="pr-visually-hidden">{legend}</legend>
      {choices.map((choice) => (
        <label
          key={choice.value}
          className={`pr-choices__option${choice.value === value ? ' pr-choices__option--selected' : ''}`}
        >
          <input
            type="radio"
            className="pr-choices__input"
            checked={choice.value === value}
            onChange={() => onChange(choice.value)}
          />
          {choice.label}
        </label>
      ))}
    </fieldset>
  );
}
