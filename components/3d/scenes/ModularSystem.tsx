'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MODULES = 12;

export function ModularSystem() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= delta * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group position={[0, -2, -5]} ref={groupRef}>
      {/* Central spine */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 20, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.8} emissive="#00e5ff" emissiveIntensity={0.2} />
      </mesh>

      {/* Modules attached to spine */}
      {Array.from({ length: MODULES }).map((_, i) => (
        <SystemModule key={i} index={i} />
      ))}
      
      <pointLight position={[0, 0, 0]} intensity={3} color="#00e5ff" distance={30} decay={2} />
      <ambientLight intensity={0.05} color="#ffffff" />
    </group>
  );
}

function SystemModule({ index }: { index: number }) {
  const meshRef = useRef<THREE.Group>(null);
  const heightOffset = (index - MODULES / 2) * 1.5;
  const angle = (index / MODULES) * Math.PI * 4;
  const radius = 3;

  useFrame((state) => {
    if (meshRef.current) {
      // Modules expand and contract slightly
      const t = state.clock.elapsedTime;
      const s = 1 + Math.sin(t * 2 + index) * 0.1;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={meshRef} position={[Math.cos(angle) * radius, heightOffset, Math.sin(angle) * radius]}>
      {/* Connector line to spine */}
      <mesh position={[-Math.cos(angle) * radius / 2, 0, -Math.sin(angle) * radius / 2]} rotation={[0, -angle, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, radius]} />
        <meshStandardMaterial color="#4a6080" roughness={0.8} />
      </mesh>
      
      {/* Module Body */}
      <mesh>
        <boxGeometry args={[1.5, 0.8, 1.5]} />
        <meshStandardMaterial color="#020305" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Glowing inner core */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.55, 0.2, 1.55]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
