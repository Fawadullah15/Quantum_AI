'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const PRODUCTS = [
  { id: 'management', label: 'BUSINESS MANAGEMENT', pos: [-4, 0, 0] },
  { id: 'assistant', label: 'AI ASSISTANT', pos: [0, 0, 2] },
  { id: 'analytics', label: 'ANALYTICS ENGINE', pos: [4, 0, 0] },
];

export function ProductsInterfaces({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle hovering for the whole group
      groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <group position={position} ref={groupRef}>
      <Text position={[0, 4, -2]} fontSize={1} color="#ffffff" letterSpacing={0.2} anchorX="center">
        PRODUCTS
      </Text>
      
      {PRODUCTS.map((prod) => (
        <ProductPlane key={prod.id} label={prod.label} position={prod.pos as [number, number, number]} />
      ))}
    </group>
  );
}

function ProductPlane({ label, position }: { label: string, position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      // Very slow rotation to feel 3D
      ref.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <group position={position} ref={ref}>
      {/* Front Glass */}
      <mesh>
        <planeGeometry args={[3, 4]} />
        <meshStandardMaterial 
          color="#1e1e2f" 
          transparent 
          opacity={0.7} 
          roughness={0.1} 
          metalness={0.8} 
        />
      </mesh>
      
      {/* Back glow */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[3.1, 4.1]} />
        <meshBasicMaterial color="#4f46e5" />
      </mesh>

      {/* Interface Mockup Elements */}
      <mesh position={[0, 1.2, 0.01]}>
        <planeGeometry args={[2.6, 1]} />
        <meshBasicMaterial color="#2d2d44" />
      </mesh>
      <mesh position={[-0.65, -0.5, 0.01]}>
        <planeGeometry args={[1.2, 2]} />
        <meshBasicMaterial color="#2d2d44" />
      </mesh>
      <mesh position={[0.65, -0.5, 0.01]}>
        <planeGeometry args={[1.2, 2]} />
        <meshBasicMaterial color="#2d2d44" />
      </mesh>

      <Text position={[0, -2.5, 0]} fontSize={0.25} color="#ffffff" anchorX="center">
        {label}
      </Text>
    </group>
  );
}
