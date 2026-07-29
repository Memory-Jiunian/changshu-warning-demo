import { useLayoutEffect, useRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import './ui.css';

type TextareaDesignSystem = 'legacy' | 'figma-v01';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  designSystem?: TextareaDesignSystem;
  error?: boolean;
  autoGrow?: boolean;
  maxAutoGrowHeight?: number;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Textarea({
  className,
  designSystem = 'legacy',
  error = false,
  autoGrow,
  maxAutoGrowHeight,
  onInput,
  'aria-invalid': ariaInvalid,
  ...props
}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const shouldAutoGrow = autoGrow ?? designSystem === 'figma-v01';
  const autoGrowLimit =
    maxAutoGrowHeight ??
    (designSystem === 'figma-v01' ? Number.POSITIVE_INFINITY : 220);

  const resize = () => {
    if (!shouldAutoGrow || !ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${Math.min(ref.current.scrollHeight, autoGrowLimit)}px`;
    ref.current.style.overflowY =
      ref.current.scrollHeight > autoGrowLimit ? 'auto' : 'hidden';
  };

  useLayoutEffect(resize, [autoGrowLimit, props.value, shouldAutoGrow]);

  return (
    <textarea
      ref={ref}
      className={cx(
        'ui-textarea',
        designSystem === 'figma-v01' && 'ui-textarea--figma-v01',
        error && 'ui-textarea--error',
        className,
      )}
      aria-invalid={error ? true : ariaInvalid}
      onInput={(event) => {
        resize();
        onInput?.(event);
      }}
      {...props}
    />
  );
}
