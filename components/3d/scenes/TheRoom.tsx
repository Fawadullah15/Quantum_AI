'use client';

/**
 * TheRoom — Scene 01 & 02
 * 
 * Camera starts at Z=8, looking toward Z=-∞.
 * The TV wall is placed at Z=0 so it fills the view immediately.
 * Rebuilt for cinematic realism: extreme shadows, stark white/cyan content on pure black monitors.
 */

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 15 screens in a 5-column × 3-row grid
const SCREEN_LABELS = [
  'SYS.01: AGENT',    'SYS.02: AUTOMATION', 'SYS.03: VISION', 'SYS.04: RAG',      'SYS.05: INFRA',
  'SYS.06: MODELS',   'SYS.07: PLATFORM',   'SYS.08: TUNING', 'SYS.09: PIPELINE', 'SYS.10: DATA',
  'SYS.11: COMPUTE',  'SYS.12: KNOWLEDGE',  'SYS.13: LOGIC',  'SYS.14: API',      'SYS.15: NEURAL',
];

const COL = 5;
const ROW = 3;
const TV_W = 3.6;
const TV_H = 2.2;
const GAP_X = 0.2;
const GAP_Y = 0.2;

function getGridPos(i: number): [number, number, number] {
  const col = i % COL;
  const row = Math.floor(i / COL);
  const totalW = COL * TV_W + (COL - 1) * GAP_X;
  const totalH = ROW * TV_H + (ROW - 1) * GAP_Y;
  const x = col * (TV_W + GAP_X) - totalW / 2 + TV_W / 2;
  const y = -(row * (TV_H + GAP_Y) - totalH / 2 + TV_H / 2);
  return [x, y, 0];
}

export function TheRoom({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, -40]} receiveShadow>
        <planeGeometry args={[120, 200]} />
        <meshStandardMaterial color="#000000" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 10, -40]}>
        <planeGeometry args={[120, 200]} />
        <meshStandardMaterial color="#000000" roughness={1} />
      </mesh>

      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-30, 3, -40]}>
        <planeGeometry args={[200, 40]} />
        <meshStandardMaterial color="#020202" roughness={0.95} />
      </mesh>

      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[30, 3, -40]}>
        <planeGeometry args={[200, 40]} />
        <meshStandardMaterial color="#020202" roughness={0.95} />
      </mesh>

      {/* Human silhouette — realistic scale (small) */}
      <HumanSilhouette position={[-2.5, -4.8, 5]} />

      {/* TV Wall */}
      <group position={[0, 0, 0]}>
        {SCREEN_LABELS.map((label, i) => (
          <TvScreen key={label} label={label} gridPos={getGridPos(i)} index={i} />
        ))}
      </group>

      {/* Harsh minimal lighting from TV wall */}
      <pointLight position={[0, 1, 3]} intensity={4} color="#00e5ff" distance={25} decay={2} />
      <pointLight position={[-10, -2, 2]} intensity={2} color="#ffffff" distance={15} decay={2} />
      <pointLight position={[10, 4, 2]} intensity={2} color="#00e5ff" distance={15} decay={2} />
    </group>
  );
}

function HumanSilhouette({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 1.7, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
}

function TvScreen({
  label,
  gridPos,
  index,
}: {
  label: string;
  gridPos: [number, number, number];
  index: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const screenMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const floatOffset = useMemo(() => (index / SCREEN_LABELS.length) * Math.PI * 2, [index]);

  // Stark monochrome data schematic texture
  const noiseTexture = useMemo(() => {
    const w = 512;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    
    // Pure black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    
    // Abstract sharp UI elements (cyan/white)
    ctx.lineWidth = 1;
    ctx.strokeStyle = index % 2 === 0 ? '#00e5ff' : '#ffffff';
    ctx.globalAlpha = 0.4;
    
    // Grid
    for(let x = 0; x < w; x+= 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for(let y = 0; y < h; y+= 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    
    // Waveform / Data line
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h/2);
    for(let x = 0; x < w; x+= 10) {
      const y = h/2 + Math.sin(x * 0.05 + index) * 40 + (Math.random() * 20 - 10);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    return new THREE.CanvasTexture(canvas);
  }, [index]);

  useFrame((state) => {
    if (!groupRef.current || !screenMatRef.current) return;
    const t = state.clock.getElapsedTime();

    // Floating motion is removed to feel more architectural and physical.
    // Screens are rigidly mounted.
    
    // Intensity pulses slightly for a "live" feel
    const pulse = Math.sin(t * 3 + floatOffset) * 0.1;
    const targetIntensity = hovered ? 2.0 : 0.6 + pulse;
    screenMatRef.current.emissiveIntensity += (targetIntensity - screenMatRef.current.emissiveIntensity) * 0.1;

    // Hover effect: screen physically moves forward slightly
    const targetZ = hovered ? gridPos[2] + 0.4 : gridPos[2];
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.1;
  });

  return (
    <group
      ref={groupRef}
      position={gridPos}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'crosshair'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Matte black industrial bezel */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[TV_W + 0.05, TV_H + 0.05, 0.1]} />
        <meshStandardMaterial color="#020202" roughness={0.9} metalness={0.5} />
      </mesh>

      {/* Screen glass */}
      <mesh>
        <planeGeometry args={[TV_W, TV_H]} />
        <meshStandardMaterial
          ref={screenMatRef}
          map={noiseTexture}
          emissive="#ffffff"
          emissiveMap={noiseTexture}
          emissiveIntensity={0.6}
          roughness={0.0}
          metalness={1.0}
        />
      </mesh>

      {/* Technical label on screen */}
      <ScreenLabel label={label} hovered={hovered} />
    </group>
  );
}

function ScreenLabel({ label, hovered }: { label: string; hovered: boolean }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, 30, 30);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [label]);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity += ((hovered ? 1.0 : 0.4) - matRef.current.opacity) * 0.1;
    }
  });

  return (
    <mesh position={[0, 0, 0.01]}>
      <planeGeometry args={[TV_W, TV_H]} />
      <meshBasicMaterial ref={matRef} map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
