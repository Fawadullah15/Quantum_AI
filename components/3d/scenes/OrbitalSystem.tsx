'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ORBITS = [
  { name: 'AI', radius: 6, speed: 0.3, count: 4, color: '#00e5ff' },
  { name: 'ENGINEERING', radius: 9, speed: 0.2, count: 6, color: '#ffffff' },
  { name: 'DESIGN', radius: 12, speed: 0.15, count: 5, color: '#8888ff' },
  { name: 'PRODUCT', radius: 15, speed: 0.1, count: 3, color: '#ffffff' },
  { name: 'RESEARCH', radius: 18, speed: 0.08, count: 4, color: '#00e5ff' },
];

export function OrbitalSystem() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.PI * 0.2; // Tilt so orbits are visible
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -5]}>
      {/* Central star */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial color="#030508" roughness={0} metalness={1} emissive="#00e5ff" emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={3} color="#00e5ff" distance={30} decay={2} />

      {ORBITS.map((orbit, i) => (
        <OrbitRing key={i} orbit={orbit} />
      ))}
    </group>
  );
}

function OrbitRing({ orbit }: { orbit: typeof ORBITS[0] }) {
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * orbit.speed;
    }
  });

  return (
    <group ref={ringRef}>
      {/* Orbit path */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbit.radius - 0.02, orbit.radius + 0.02, 64]} />
        <meshBasicMaterial color={orbit.color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Bodies on orbit */}
      {Array.from({ length: orbit.count }).map((_, j) => {
        const angle = (j / orbit.count) * Math.PI * 2;
        const x = Math.cos(angle) * orbit.radius;
        const z = Math.sin(angle) * orbit.radius;
        return (
          <mesh key={j} position={[x, 0, z]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color={orbit.color} roughness={0.5} metalness={0.8} emissive={orbit.color} emissiveIntensity={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}
