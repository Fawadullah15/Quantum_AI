'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const INSTALLATIONS = 6;

export function DigitalGallery() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Extremely slow rotation
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, -5]}>
      {Array.from({ length: INSTALLATIONS }).map((_, i) => {
        const angle = (i / INSTALLATIONS) * Math.PI * 2;
        const radius = 20;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <Installation 
            key={i} 
            position={[x, 0, z]} 
            rotation={[0, -angle + Math.PI / 2, 0]} 
            index={i}
          />
        );
      })}

      <ambientLight intensity={0.1} color="#ffffff" />
      <pointLight position={[0, 10, 0]} intensity={3} color="#ffffff" distance={50} decay={2} />
    </group>
  );
}

function Installation({ position, rotation, index }: { position: [number, number, number], rotation: [number, number, number], index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(t * 0.5 + index) * 0.5;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1 + Math.sin(t * 2 + index) * 0.5;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Massive Frame */}
      <mesh ref={meshRef}>
        <boxGeometry args={[16, 9, 1]} />
        <meshStandardMaterial color="#020304" roughness={0.1} metalness={0.9} />
        
        {/* Glow surface */}
        <mesh position={[0, 0, 0.51]}>
          <planeGeometry args={[15.5, 8.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
        </mesh>
      </mesh>

      {/* Localized stark spotlighting */}
      <pointLight ref={lightRef} position={[0, 0, 2]} intensity={1.5} color="#00e5ff" distance={15} decay={2} />
    </group>
  );
}
