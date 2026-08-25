'use client';

import React from 'react';
import Link from 'next/link';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  external?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      href,
      external,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      style,
      disabled,
      children,
      ...rest
    },
    ref
  ) => {
    const variantClass = `btn-${variant}`;
    const sizeClass = `btn-${size}`;
    const fullWidthClass = fullWidth ? 'w-full' : '';
    const combinedClassName = `btn ${variantClass} ${sizeClass} ${fullWidthClass} ${className}`.trim();

    const content = (
      <>
        {leftIcon && <span className="btn-icon-left" style={{ display: 'inline-flex', alignItems: 'center' }}>{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="btn-icon-right" style={{ display: 'inline-flex', alignItems: 'center' }}>{rightIcon}</span>}
      </>
    );

    if (href) {
      if (external) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={combinedClassName}
            style={style}
            aria-disabled={disabled}
            {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
          >
            {content}
          </a>
        );
      }
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={combinedClassName}
          style={style}
          aria-disabled={disabled}
          {...(rest as any)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled}
        className={combinedClassName}
        style={style}
        {...rest}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { NovaButton, GalaxyButton, ButtonStyles } from './Buttons';
