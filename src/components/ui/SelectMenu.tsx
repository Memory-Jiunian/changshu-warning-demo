import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import './ui.css';

export interface SelectMenuOption {
  value: string;
  label: string;
  disabled?: boolean;
  showTrailingIcon?: boolean;
  trailingIcon?: ReactNode;
}

export interface SelectItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  state?: 'default' | 'selected' | 'disabled';
  label: string;
  showTrailingIcon?: boolean;
  trailingIcon?: ReactNode;
}

export interface SelectMenuProps {
  value?: string;
  defaultValue?: string;
  options: SelectMenuOption[];
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showDisabledSection?: boolean;
  name?: string;
  id?: string;
  ariaLabel?: string;
  className?: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="m4 8.25 2.4 2.4L12 5.35" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="m4.5 6.25 3.5 3.5 3.5-3.5" />
    </svg>
  );
}

export function SelectItem({
  state = 'default',
  label,
  showTrailingIcon = true,
  trailingIcon,
  className,
  disabled,
  ...props
}: SelectItemProps) {
  const isDisabled = disabled || state === 'disabled';

  return (
    <button
      type="button"
      role="option"
      aria-selected={state === 'selected'}
      className={cx('ui-select-menu__item', `ui-select-menu__item--${state}`, className)}
      disabled={isDisabled}
      {...props}
    >
      <span className="ui-select-menu__item-label">{label}</span>
      {showTrailingIcon ? (
        <span className="ui-select-menu__item-icon">{trailingIcon ?? <CheckIcon />}</span>
      ) : null}
    </button>
  );
}

export function SelectMenu({
  value,
  defaultValue = '',
  options,
  onValueChange,
  placeholder = '请选择',
  disabled = false,
  showDisabledSection = true,
  name,
  id,
  ariaLabel,
  className,
}: SelectMenuProps) {
  const generatedId = useId();
  const triggerId = id ?? `select-menu-trigger-${generatedId}`;
  const listboxId = `select-menu-listbox-${generatedId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value === undefined ? internalValue : value;
  const selectedOption = options.find((option) => option.value === currentValue);
  const availableOptions = options.filter((option) => !option.disabled);
  const disabledOptions = options.filter((option) => option.disabled);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function selectOption(option: SelectMenuOption) {
    if (option.disabled) {
      return;
    }

    if (value === undefined) {
      setInternalValue(option.value);
    }
    onValueChange?.(option.value);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={cx('ui-select-menu', open && 'is-open', className)}
    >
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <button
        id={triggerId}
        type="button"
        className="ui-select-menu__trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selectedOption ? undefined : 'ui-select-menu__placeholder'}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span className="ui-select-menu__trigger-icon">
          <ChevronIcon />
        </span>
      </button>

      {open ? (
        <div
          id={listboxId}
          className="ui-select-menu__content"
          role="listbox"
          aria-labelledby={ariaLabel ? undefined : triggerId}
        >
          <div className="ui-select-menu__available-options">
            {availableOptions.map((option) => {
              const selected = option.value === currentValue;

              return (
                <SelectItem
                  key={option.value}
                  state={selected ? 'selected' : 'default'}
                  label={option.label}
                  showTrailingIcon={option.showTrailingIcon}
                  trailingIcon={option.trailingIcon}
                  onClick={() => selectOption(option)}
                />
              );
            })}
          </div>

          {showDisabledSection && disabledOptions.length > 0 ? (
            <div className="ui-select-menu__disabled-section">
              <div className="ui-select-menu__divider" aria-hidden="true" />
              {disabledOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  state="disabled"
                  label={option.label}
                  showTrailingIcon={option.showTrailingIcon}
                  trailingIcon={option.trailingIcon}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
