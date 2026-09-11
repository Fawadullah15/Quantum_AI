'use client';

/**
 * GlobalParticles — Restrained, cinematic depth dust.
 * Very sparse white/silver particles along the Z-tunnel.
 * These look like floating dust in a dark studio, not a particle explosion.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 800; // Deliberately low — restraint is cinematic

export function GlobalParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const geomRef   = useRef<THREE.BufferGeometry>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 30;   // X spread
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;   // Y spread
      pos[i * 3 + 2] = 8 - Math.random() * 170;       // Z: full tunnel
    }
    return pos;
  }, []);

  const speeds = useMemo(() => {
    const s = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) s[i] = 0.3 + Math.random() * 0.8;
    return s;
  }, []);

  const posAttr = useMemo(() => new THREE.BufferAttribute(positions, 3), [positions]);

  useFrame((_state, delta) => {
    if (!geomRef.current) return;
    const attr = geomRef.current.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 2] += speeds[i] * delta;
      if (arr[i * 3 + 2] > 10) arr[i * 3 + 2] = -165;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geomRef}>
        <primitive object={posAttr} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#c0d0e0"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
