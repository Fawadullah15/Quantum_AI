'use client';

/**
 * GlobalParticles — Restrained, cinematic depth dust.
 * Very sparse white/silver particles along the Z-tunnel.
 * These look like floating dust in a dark studio, not a particle explosion.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DESKTOP_COUNT = 800; // Restrained desktop dust
const MOBILE_COUNT  = 220; // Focused mobile particles

export function GlobalParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const geomRef   = useRef<THREE.BufferGeometry>(null);
  const { size }  = useThree();

  const isMobile = (size.width || (typeof window !== 'undefined' ? window.innerWidth : 1200)) < 768;
  const count = isMobile ? MOBILE_COUNT : DESKTOP_COUNT;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spreadX = isMobile ? 14 : 30;
    const spreadY = isMobile ? 18 : 16;
    const tunnelDepth = isMobile ? 65 : 170;

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * spreadX;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spreadY;
      pos[i * 3 + 2] = 8 - Math.random() * tunnelDepth;
    }
    return pos;
  }, [count, isMobile]);

  const speeds = useMemo(() => {
    const s = new Float32Array(count);
    const baseSpeed = isMobile ? 0.2 : 0.3;
    for (let i = 0; i < count; i++) s[i] = baseSpeed + Math.random() * (isMobile ? 0.5 : 0.8);
    return s;
  }, [count, isMobile]);

  const posAttr = useMemo(() => new THREE.BufferAttribute(positions, 3), [positions]);

  useFrame((_state, delta) => {
    if (!geomRef.current) return;
    const attr = geomRef.current.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const resetZ = isMobile ? -60 : -165;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 2] += speeds[i] * delta;
      if (arr[i * 3 + 2] > 10) arr[i * 3 + 2] = resetZ;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geomRef}>
        <primitive object={posAttr} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial
        size={isMobile ? 0.035 : 0.04}
        color="#c0d0e0"
        transparent
        opacity={isMobile ? 0.22 : 0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
