import {
  forwardRef,
  type ButtonHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
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
  required?: boolean;
  error?: boolean;
  'aria-describedby'?: string;
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

export const SelectItem = forwardRef<HTMLButtonElement, SelectItemProps>(
  function SelectItem(
    {
      state = 'default',
      label,
      showTrailingIcon,
      trailingIcon,
      className,
      disabled,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || state === 'disabled';
    const shouldShowTrailingIcon =
      showTrailingIcon ?? state === 'selected';

    return (
      <button
        ref={ref}
        type="button"
        role="option"
        aria-selected={state === 'selected'}
        className={cx('ui-select-menu__item', `ui-select-menu__item--${state}`, className)}
        disabled={isDisabled}
        {...props}
      >
        <span className="ui-select-menu__item-label">{label}</span>
        {shouldShowTrailingIcon ? (
          <span className="ui-select-menu__item-icon">{trailingIcon ?? <CheckIcon />}</span>
        ) : null}
      </button>
    );
  },
);

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
  required = false,
  error = false,
  'aria-describedby': ariaDescribedBy,
  className,
}: SelectMenuProps) {
  const generatedId = useId();
  const triggerId = id ?? `select-menu-trigger-${generatedId}`;
  const listboxId = `select-menu-listbox-${generatedId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef(new Map<string, HTMLButtonElement>());
  const [open, setOpen] = useState(false);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value === undefined ? internalValue : value;
  const selectedOption = options.find((option) => option.value === currentValue);
  const availableOptions = options.filter((option) => !option.disabled);
  const disabledOptions = options.filter((option) => option.disabled);

  useEffect(() => {
    if (!open || !activeValue) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      optionRefs.current.get(activeValue)?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeValue, open]);

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
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function openMenu() {
    const initialOption =
      availableOptions.find((option) => option.value === currentValue)
      ?? availableOptions[0];
    setActiveValue(initialOption?.value ?? null);
    setOpen(true);
  }

  function closeMenu({ focusTrigger = false } = {}) {
    setOpen(false);
    if (focusTrigger) {
      triggerRef.current?.focus();
    }
  }

  function selectOption(option: SelectMenuOption) {
    if (option.disabled) {
      return;
    }

    if (value === undefined) {
      setInternalValue(option.value);
    }
    onValueChange?.(option.value);
    setActiveValue(option.value);
    closeMenu({ focusTrigger: true });
  }

  function moveActiveOption(direction: -1 | 1) {
    if (availableOptions.length === 0) {
      return;
    }

    setActiveValue((current) => {
      const currentIndex = availableOptions.findIndex(
        (option) => option.value === current,
      );
      const fallbackIndex = direction === 1 ? -1 : availableOptions.length;
      const nextIndex = Math.min(
        availableOptions.length - 1,
        Math.max(
          0,
          (currentIndex === -1 ? fallbackIndex : currentIndex) + direction,
        ),
      );
      return availableOptions[nextIndex].value;
    });
  }

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveActiveOption(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const activeOption = availableOptions.find(
        (option) => option.value === activeValue,
      );
      if (activeOption) {
        selectOption(activeOption);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu({ focusTrigger: true });
    }
  }

  return (
    <div
      ref={rootRef}
      className={cx(
        'ui-select-menu',
        open && 'is-open',
        error && 'ui-select-menu--error',
        className,
      )}
    >
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="ui-select-menu__trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-required={required || undefined}
        aria-invalid={error || undefined}
        aria-describedby={error ? ariaDescribedBy : undefined}
        disabled={disabled}
        onClick={() => {
          if (open) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
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
          onKeyDown={handleMenuKeyDown}
        >
          <div className="ui-select-menu__available-options">
            {availableOptions.map((option) => {
              const selected = option.value === currentValue;

              return (
                <SelectItem
                  key={option.value}
                  ref={(node) => {
                    if (node) {
                      optionRefs.current.set(option.value, node);
                    } else {
                      optionRefs.current.delete(option.value);
                    }
                  }}
                  state={selected ? 'selected' : 'default'}
                  label={option.label}
                  showTrailingIcon={
                    selected
                    || Boolean(option.showTrailingIcon && option.trailingIcon)
                  }
                  trailingIcon={option.trailingIcon}
                  tabIndex={option.value === activeValue ? 0 : -1}
                  onFocus={() => setActiveValue(option.value)}
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
                  showTrailingIcon={Boolean(
                    option.showTrailingIcon && option.trailingIcon,
                  )}
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
