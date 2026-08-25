import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  narrow?: boolean;
  children: React.ReactNode;
}

export function Container({
  narrow = false,
  className = '',
  style,
  children,
  ...rest
}: ContainerProps) {
  const containerClass = narrow ? 'container-narrow' : 'container';
  return (
    <div className={`${containerClass} ${className}`.trim()} style={style} {...rest}>
      {children}
    </div>
  );
}
