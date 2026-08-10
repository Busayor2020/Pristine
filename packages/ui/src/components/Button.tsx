import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'quiet' | 'inline';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly children: ReactNode;
}

/**
 * Every button clears the 44px minimum hit area, including `inline`, which
 * looks like a text link but is not one. A link sized control is the most
 * common way a one handed outdoor user loses a tap.
 */
export function Button({ variant = 'primary', className, type, children, ...rest }: ButtonProps) {
  const classes = ['pr-button', `pr-button--${variant}`, className].filter(Boolean).join(' ');
  return (
    <button type={type ?? 'button'} className={classes} {...rest}>
      {children}
    </button>
  );
}
