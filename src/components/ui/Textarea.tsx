import type { TextareaHTMLAttributes } from 'react';
import './ui.css';

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`ui-textarea ${className}`.trim()} {...props} />;
}
