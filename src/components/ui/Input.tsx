import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { classNames } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, icon, className, ...rest }: InputProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{icon}</div>}
        <input className={classNames('input', icon ? 'pl-10' : '', error && 'border-danger-500', className)} {...rest} />
      </div>
      {error && <p className="text-xs text-danger-400 mt-1.5">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, className, children, ...rest }: SelectProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className={classNames('input', error && 'border-danger-500', className)} {...rest}>
        {children}
      </select>
      {error && <p className="text-xs text-danger-400 mt-1.5">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...rest }: TextareaProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea className={classNames('input resize-none', error && 'border-danger-500', className)} {...rest} />
      {error && <p className="text-xs text-danger-400 mt-1.5">{error}</p>}
    </div>
  );
}
