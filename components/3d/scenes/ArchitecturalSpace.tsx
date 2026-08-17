'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ArchitecturalSpace() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group position={[0, -5, 0]}>
      {/* Massive geometric floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#020304" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Rotating central monolith structure */}
      <group ref={groupRef}>
        <mesh position={[0, 10, 0]}>
          <boxGeometry args={[4, 20, 4]} />
          <meshStandardMaterial color="#010203" roughness={0.5} metalness={0.5} />
        </mesh>
        
        <mesh position={[0, 10, 0]}>
          <boxGeometry args={[4.2, 19.8, 4.2]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.05} />
        </mesh>
      </group>

      {/* Atmospheric lighting */}
      <pointLight position={[10, 5, 10]} intensity={1} color="#ffffff" distance={30} decay={2} />
      <pointLight position={[-10, 20, -10]} intensity={2} color="#00e5ff" distance={40} decay={2} />
      
      {/* Heavy fog for architectural scale */}
      <fog attach="fog" args={['#000000', 10, 50]} />
    </group>
  );
}
