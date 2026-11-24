import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'danger' | 'danger-outline';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-[18px] text-[15px] no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent font-semibold text-on-accent hover:bg-accent-hover hover:text-on-accent',
  secondary:
    'border border-border-strong bg-transparent font-medium text-ink hover:bg-nav-selected hover:text-ink',
  danger:
    'border-0 bg-danger font-semibold text-white hover:bg-danger/85 hover:text-white',
  'danger-outline':
    'border border-danger-border bg-transparent font-semibold text-danger-ink hover:bg-danger-soft hover:text-danger-ink',
};

export function buttonClass(variant: Variant = 'primary', extra = '') {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button type={type} className={buttonClass(variant, className)} {...rest} />
  );
}

export function LinkButton({
  variant = 'primary',
  className = '',
  ...rest
}: LinkProps & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...rest} />;
}
