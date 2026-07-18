import { useLayoutEffect, useRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import './ui.css';

export function Textarea({
  className = '',
  autoGrow = false,
  maxAutoGrowHeight = 220,
  onInput,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  autoGrow?: boolean;
  maxAutoGrowHeight?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    if (!autoGrow || !ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${Math.min(ref.current.scrollHeight, maxAutoGrowHeight)}px`;
    ref.current.style.overflowY =
      ref.current.scrollHeight > maxAutoGrowHeight ? 'auto' : 'hidden';
  };

  useLayoutEffect(resize, [autoGrow, maxAutoGrowHeight, props.value]);

  return (
    <textarea
      ref={ref}
      className={`ui-textarea ${className}`.trim()}
      onInput={(event) => {
        resize();
        onInput?.(event);
      }}
      {...props}
    />
  );
}
