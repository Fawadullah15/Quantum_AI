'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function PhilosophyCore() {
  const innerRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (innerRef.current) {
      innerRef.current.rotation.x += delta * 0.2;
      innerRef.current.rotation.y += delta * 0.3;
    }
    if (outerRef.current) {
      outerRef.current.rotation.x -= delta * 0.1;
      outerRef.current.rotation.z += delta * 0.15;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.05;
      wireRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime) * 0.05);
    }
  });

  return (
    <group position={[0, -2, -10]}>
      {/* Dense dark core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[2.5, 0]} />
        <meshStandardMaterial color="#000000" roughness={0.1} metalness={1} />
      </mesh>
      
      {/* Outer translucent shell */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[3.2, 1]} />
        <meshPhysicalMaterial 
          color="#001122" 
          transmission={0.9} 
          opacity={1} 
          metalness={0} 
          roughness={0} 
          ior={1.5} 
          thickness={0.5}
        />
      </mesh>
      
      {/* Wireframe abstraction */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[4, 2]} />
        <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>

      <pointLight position={[0, 0, 0]} intensity={2} color="#00e5ff" distance={15} decay={2} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
    </group>
  );
}
