import type { SelectHTMLAttributes } from 'react';
import './ui.css';

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`ui-select ${className}`.trim()} {...props} />;
}
