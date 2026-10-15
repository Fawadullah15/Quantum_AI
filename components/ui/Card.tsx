'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'interactive';
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  className = '',
  style,
  children,
  onClick,
  onKeyDown,
  tabIndex,
  ...rest
}: CardProps) {
  const isInteractive = variant === 'interactive';
  const variantClass = variant === 'subtle' 
    ? 'card-subtle' 
    : isInteractive 
    ? 'card-interactive' 
    : '';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
    } else if (isInteractive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e as any);
    }
  };

  return (
    <div
      role={isInteractive && onClick ? 'button' : rest.role}
      tabIndex={isInteractive ? (tabIndex ?? 0) : tabIndex}
      className={`card ${variantClass} ${className}`.trim()}
      style={style}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = '',
  style,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-header ${className}`.trim()} style={style} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({
  as: Component = 'h3',
  className = '',
  style,
  children,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }) {
  return (
    <Component className={`card-title ${className}`.trim()} style={style} {...rest}>
      {children}
    </Component>
  );
}

export function CardDescription({
  className = '',
  style,
  children,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`card-description ${className}`.trim()} style={style} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({
  className = '',
  style,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-body ${className}`.trim()} style={style} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = '',
  style,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-footer ${className}`.trim()} style={style} {...rest}>
      {children}
    </div>
  );
}
