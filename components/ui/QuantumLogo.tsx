import React from 'react';
import Image from 'next/image';

export interface QuantumLogoProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Legacy hero prop kept for backward compatibility */
  hero?: boolean;
}

/**
 * Quantum AI "Q" mark.
 * Uses the official 3D orbital-Q brand logo image.
 */
export function QuantumLogo({ width = 32, height = 32, className, style }: QuantumLogoProps) {
  return (
    <Image
      src="/quantum-q-logo.png"
      alt="Quantum AI"
      width={width}
      height={height}
      className={className}
      style={{
        display: 'inline-block',
        objectFit: 'contain',
        flexShrink: 0,
        ...style,
      }}
      priority
    />
  );
}
