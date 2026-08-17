import React from 'react';

export interface QuantumLogoProps extends React.SVGProps<SVGSVGElement> {
  /** If true, renders a thicker stroke mark suitable for large hero use */
  hero?: boolean;
}

/**
 * Quantum AI "Q" mark.
 * Circular arc (open bottom-right) + inner glowing dot + diagonal tail.
 * Matches the brand reference: clean geometric Q with orbital intelligence dot.
 */
export function QuantumLogo({ hero, className, style, ...props }: QuantumLogoProps) {
  const id = 'ql';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="1em"
      height="1em"
      className={className}
      style={{ display: 'inline-block', ...style }}
      fill="none"
      aria-label="Quantum AI"
      role="img"
      {...props}
    >
      <defs>
        {/* Outer ring glow */}
        <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Dot glow — bright blue */}
        <filter id={`${id}-dot-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`${id}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFF" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id={`${id}-tail`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFF" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>

      {/*
        Q Ring: an arc that is open in the bottom-right quadrant
        Center (50,50), radius 34, strokeWidth 9
        Arc from ~225° to ~315° is the gap (bottom-right opening)
        We draw from 315° back around to 225° the long way.
        315° in rad = 5.497, in coordinates: (50 + 34*cos(315°), 50 + 34*sin(315°)) = (74.0, 26.0)
        225° in rad = 3.927, in coordinates: (50 + 34*cos(225°), 50 + 34*sin(225°)) = (26.0, 74.0)
      */}
      <path
        d="M 74.0 26.0 A 34 34 0 1 0 26.0 74.0"
        stroke={`url(#${id}-ring)`}
        strokeWidth="9"
        strokeLinecap="round"
        filter={`url(#${id}-glow)`}
      />

      {/*
        Diagonal tail: the Q's descending stroke.
        Starts from near the gap-end on the bottom-right (~68,68), goes to (88,88)
      */}
      <line
        x1="68" y1="68"
        x2="90" y2="90"
        stroke={`url(#${id}-tail)`}
        strokeWidth="9"
        strokeLinecap="round"
        filter={`url(#${id}-glow)`}
      />

      {/*
        Inner intelligence dot — the orbital element, vivid electric blue.
        Placed at the "intersection" of the ring, upper-right area (62, 24).
      */}
      <circle
        cx="76"
        cy="24"
        r="6"
        fill="#1677FF"
        filter={`url(#${id}-dot-glow)`}
      />
      {/* Bright core of dot */}
      <circle
        cx="76"
        cy="24"
        r="3"
        fill="#55D6FF"
        filter={`url(#${id}-dot-glow)`}
      />
    </svg>
  );
}
