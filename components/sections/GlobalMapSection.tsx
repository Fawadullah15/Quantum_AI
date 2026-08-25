'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';

const WorldMapSVG = dynamic(() => import('../WorldMapSVG'), { ssr: false });

// ─── Marker Data ──────────────────────────────────────────────────────────────

interface Marker {
  id: string;
  label: string;
  subLabel: string;
  /** Position as percentage of the 1000x500 SVG viewBox */
  cx: number; // 0-100
  cy: number; // 0-100
}

const MARKERS: Marker[] = [
  { id: 'south-asia',    label: 'SOUTH ASIA',    subLabel: 'Pakistan · India',        cx: 67.5, cy: 43.0 },
  { id: 'middle-east',  label: 'MIDDLE EAST',   subLabel: 'UAE · Saudi Arabia',       cx: 61.0, cy: 47.5 },
  { id: 'europe',       label: 'EUROPE',        subLabel: 'UK · Germany · France',    cx: 50.5, cy: 29.0 },
  { id: 'north-america',label: 'NORTH AMERICA', subLabel: 'USA · Canada',             cx: 19.5, cy: 35.5 },
  { id: 'east-asia',    label: 'EAST ASIA',     subLabel: 'China · Japan · Korea',    cx: 80.0, cy: 37.5 },
  { id: 'africa',       label: 'AFRICA',        subLabel: 'Growing Connections',       cx: 52.0, cy: 58.0 },
];

// Helper to convert percentages to absolute SVG viewBox coordinate space
const getCoords = (cx: number, cy: number) => {
  return {
    x: (cx / 100) * 1000,
    y: (cy / 100) * 500
  };
};

// ─── Single Marker ────────────────────────────────────────────────────────────

function MapMarker({ marker }: { marker: Marker }) {
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();

  const { x, y } = getCoords(marker.cx, marker.cy);
  const flipLeft = marker.cx > 60;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      aria-label={`${marker.label} — ${marker.subLabel}`}
    >
      {/* Pulse ring */}
      {!reduce && (
        <circle
          r="14"
          fill="none"
          stroke="rgba(79, 70, 229, 0.6)"
          strokeWidth="1"
          opacity="0.35"
          style={{ animation: 'mapRingPulse 2.8s ease-out infinite' }}
        />
      )}
      {/* Glow background */}
      <circle r="8" fill="rgba(124, 58, 237, 0.2)" />
      {/* Outer ring */}
      <circle r="5.5" fill="none" stroke="#4F46E5" strokeWidth="1.5" />
      {/* Center dot */}
      <circle r="3" fill="#2563EB" />
      {/* Bright core */}
      <circle r="1.2" fill="#7C3AED" />

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.g
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            transform={`translate(${flipLeft ? -190 : 12}, -42)`}
          >
            <rect
              x="0" y="0"
              width="178" height="42"
              rx="7"
              fill="#07152F"
              stroke="rgba(79,70,229,0.4)"
              strokeWidth="1"
            />
            <text
              x="12" y="16"
              fill="#F8FAFF"
              fontSize="9.5"
              fontWeight="700"
              fontFamily="'Space Mono', monospace"
              letterSpacing="1.5"
            >
              {marker.label}
            </text>
            <text
              x="12" y="31"
              fill="#64748B"
              fontSize="8.5"
              fontFamily="'Space Mono', monospace"
              letterSpacing="0.5"
            >
              {marker.subLabel}
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function GlobalMapSection() {
  const reduce = useReducedMotion();

  // Create smooth curved lines (networks) between markers
  const connections = [
    { from: MARKERS[3], to: MARKERS[2] }, // North America to Europe
    { from: MARKERS[2], to: MARKERS[1] }, // Europe to Middle East
    { from: MARKERS[1], to: MARKERS[0] }, // Middle East to South Asia
    { from: MARKERS[0], to: MARKERS[4] }, // South Asia to East Asia
    { from: MARKERS[1], to: MARKERS[5] }, // Middle East to Africa
  ];

  return (
    <section
      style={{
        position: 'relative',
        padding: 'clamp(2.5rem, 5vh, 4rem) clamp(0.75rem, 4vw, 6rem)',
        background: 'linear-gradient(180deg, #020817 0%, #030D1E 50%, #020817 100%)',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
      }}
      aria-labelledby="map-heading"
    >
      {/* Header */}
      <div style={{ maxWidth: 720, margin: '0 auto clamp(1.5rem, 3vh, 2.25rem)', textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.68rem, 0.8vw, 0.78rem)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#1677FF',
          marginBottom: '0.45rem',
          maxWidth: 'none',
          fontWeight: 600
        }}>
          GLOBAL CONNECTIONS
        </p>
        <h2
          id="map-heading"
          style={{
            fontSize: 'clamp(1.75rem, 3.2vw, 2.65rem)',
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: '-0.025em',
            color: '#F8FAFF',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
          }}
        >
          Built for a connected world.
        </h2>
        <p style={{
          fontSize: 'clamp(0.88rem, 1.15vw, 1.02rem)',
          color: '#94A3B8',
          lineHeight: 1.6,
          maxWidth: 580,
          margin: '0 auto',
          fontWeight: 300,
        }}>
          Building software and AI systems for businesses beyond borders. Global connection points are visual representations of our technology network.
        </p>
      </div>

      {/* Map wrapper */}
      <div
        style={{
          position: 'relative',
          maxWidth: 1200,
          margin: '0 auto',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(22, 119, 255, 0.15)',
          boxShadow: '0 0 80px -30px rgba(22,119,255,0.18), inset 0 0 0 1px rgba(22,119,255,0.08)',
        }}
      >
        {/* Grid overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          backgroundImage: [
            'linear-gradient(rgba(22,119,255,0.05) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(22,119,255,0.05) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '65px 65px',
          pointerEvents: 'none',
        }} />

        {/* Country hover styles */}
        <style>{`
          @keyframes mapRingPulse {
            0%   { r: 6;  opacity: 0.55; }
            100% { r: 22; opacity: 0; }
          }
          @keyframes mapDashOffset {
            from { stroke-dashoffset: 60; }
            to { stroke-dashoffset: 0; }
          }
          .qai-world-map path,
          .qai-world-map polygon {
            fill: #0d2345; /* Slightly increased contrast from old #0A2347 */
            stroke: rgba(70, 150, 255, 0.28); /* Slightly increased opacity from 0.18 */
            stroke-width: 0.5;
            transition: fill 0.25s ease, stroke 0.25s ease;
          }
          .qai-world-map path:hover,
          .qai-world-map polygon:hover {
            fill: rgba(22, 119, 255, 0.45);
            stroke: rgba(85, 214, 255, 0.55);
          }
          @media (prefers-reduced-motion: reduce) {
            .qai-world-map path,
            .qai-world-map polygon { transition: none; }
          }
        `}</style>

        {/* World SVG map */}
        <div style={{ position: 'relative', zIndex: 2, backgroundColor: '#020b1e' }}>
          <WorldMapSVG
            className="qai-world-map"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            preserveAspectRatio="xMidYMid meet"
          />

          {/* Network and Markers Overlay */}
          <svg
            viewBox="0 0 1000 500"
            preserveAspectRatio="xMidYMid meet"
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              overflow: 'visible',
              zIndex: 10,
              pointerEvents: 'all',
            }}
            aria-hidden="true"
          >
            {/* Draw connection paths with flowing dash animation */}
            <g opacity="0.6">
              {connections.map((conn, idx) => {
                const p1 = getCoords(conn.from.cx, conn.from.cy);
                const p2 = getCoords(conn.to.cx, conn.to.cy);
                
                // Draw a beautiful curved bezier arc between nodes
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2 - Math.abs(p1.x - p2.x) * 0.15;
                const pathD = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;

                return (
                  <g key={`link-${idx}`}>
                    {/* Underlying solid connection line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#1677FF"
                      strokeWidth="1"
                      opacity="0.25"
                    />
                    {/* Flowing dashed signal line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#55D6FF"
                      strokeWidth="1.5"
                      strokeDasharray="6, 12"
                      style={{
                        animation: reduce ? 'none' : 'mapDashOffset 4s linear infinite',
                      }}
                      opacity="0.8"
                    />
                  </g>
                );
              })}
            </g>

            {/* Render node markers */}
            {MARKERS.map((m) => (
              <MapMarker key={m.id} marker={m} />
            ))}
          </svg>
        </div>
      </div>

      {/* Caption */}
      <p style={{
        textAlign: 'center',
        marginTop: '1.5rem',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono)',
        color: '#334155',
        letterSpacing: '0.1em',
      }}>
        GLOBAL CONNECTIONS — VISUAL REPRESENTATION ONLY
      </p>
    </section>
  );
}
