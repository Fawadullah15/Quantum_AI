'use client';

import React from 'react';
import { useGlobalStore } from './GlobalStore';

const SCENE_MAP: Record<string, { system: string, location: string, node: string }> = {
  'room':       { system: '01', location: 'THE ROOM',          node: '00' },
  'technology': { system: '02', location: 'GLOBAL NETWORK',    node: '74' },
  'systems':    { system: '03', location: 'NEURAL SYSTEM',     node: '12' },
  'products':   { system: '04', location: 'SOFTWARE ARTIFACTS',node: '08' },
  'work':       { system: '05', location: 'DIGITAL GALLERY',   node: '05' },
  'research':   { system: '06', location: 'AI LABORATORY',     node: '99' },
  'about':      { system: '07', location: 'ARCHITECTURAL',     node: '01' },
  'leadership': { system: '08', location: 'COMMAND CENTER',    node: '02' },
  'services':   { system: '09', location: 'MODULAR SYSTEM',    node: '44' },
  'industries': { system: '10', location: 'GLOBAL SECTORS',    node: '33' },
  'philosophy': { system: '11', location: 'PHILOSOPHY CORE',   node: '00' },
  'careers':    { system: '12', location: 'ORBITAL SYSTEM',    node: '01' },
  'insights':   { system: '13', location: 'DATABANK',          node: '55' },
  'contact':    { system: '14', location: 'SIGNAL NETWORK',    node: '00' },
};

export function WorldMapIndicator() {
  const { currentScene } = useGlobalStore();
  const data = SCENE_MAP[currentScene] || SCENE_MAP['room'];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.65rem',
      letterSpacing: '0.2em',
      color: 'var(--color-text-tertiary)',
      textTransform: 'uppercase',
      textAlign: 'right',
      transition: 'opacity 0.3s ease',
    }}>
      <div>SYSTEM / {data.system}</div>
      <div style={{ color: 'var(--color-core)' }}>LOC / {data.location}</div>
      <div>NODE / {data.node}</div>
    </div>
  );
}
