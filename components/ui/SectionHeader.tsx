import React from 'react';

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
  titleAs?: 'h1' | 'h2' | 'h3';
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  titleAs: TitleTag = 'h2',
  className = '',
  style,
  ...rest
}: SectionHeaderProps) {
  const isCenter = align === 'center';

  return (
    <div
      className={`section-header ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: isCenter ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isCenter ? 'center' : 'flex-end',
        textAlign: isCenter ? 'center' : 'left',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
        flexWrap: 'wrap',
        ...style,
      }}
      {...rest}
    >
      <div style={{ maxWidth: isCenter ? '720px' : '640px' }}>
        {eyebrow && (
          <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>
            {eyebrow}
          </div>
        )}
        <TitleTag
          className={TitleTag === 'h1' ? 'heading-1' : 'heading-2'}
          style={{ marginBottom: description ? 'var(--space-3)' : 0 }}
        >
          {title}
        </TitleTag>
        {description && (
          <p className="body-large" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            {description}
          </p>
        )}
      </div>

      {action && (
        <div style={{ flexShrink: 0, marginTop: isCenter ? 'var(--space-2)' : 0 }}>
          {action}
        </div>
      )}
    </div>
  );
}
