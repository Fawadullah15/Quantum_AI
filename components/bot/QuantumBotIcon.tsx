'use client';

import React from 'react';
import Image from 'next/image';

interface QuantumBotIconProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
}

/**
 * QuantumBot Brand Icon
 * Renders the authentic metallic Q emblem with optional cybernetic cyan glow.
 */
export function QuantumBotIcon({ size = 28, className = '', showGlow = false }: QuantumBotIconProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {showGlow && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full blur-md bg-cyan-500/25 pointer-events-none"
        />
      )}
      <Image
        src="/quantum-q-logo.png"
        alt="QuantumBot"
        width={size}
        height={size}
        priority
        className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,240,255,0.25)]"
      />
    </div>
  );
}
