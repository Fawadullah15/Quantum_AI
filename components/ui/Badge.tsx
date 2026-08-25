import React from 'react';

export type BadgeVariant = 'default' | 'primary' | 'accent' | 'success' | 'warning';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  className = '',
  style,
  children,
  ...rest
}: BadgeProps) {
  const variantClass = `badge-${variant}`;
  return (
    <span className={`badge ${variantClass} ${className}`.trim()} style={style} {...rest}>
      {children}
    </span>
  );
}
