import React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'subtle' | 'surface';
  children: React.ReactNode;
}

export function Section({
  variant = 'default',
  className = '',
  style,
  children,
  ...rest
}: SectionProps) {
  const variantClass = variant === 'subtle' 
    ? 'section-subtle' 
    : variant === 'surface' 
    ? 'section-surface' 
    : '';

  return (
    <section className={`section ${variantClass} ${className}`.trim()} style={style} {...rest}>
      {children}
    </section>
  );
}
