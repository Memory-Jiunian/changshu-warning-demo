export interface RadioOption<T extends string> {
  value: T;
  label: string;
}

export function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
  variant = 'cards',
}: {
  name: string;
  value: T | '';
  options: RadioOption<T>[];
  onChange: (value: T) => void;
  variant?: 'cards' | 'chips' | 'inline';
}) {
  return (
    <div className={`ui-radio-group ui-radio-group--${variant}`} role="radiogroup">
      {options.map((option) => {
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            className={checked ? 'ui-radio-option is-selected' : 'ui-radio-option'}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
