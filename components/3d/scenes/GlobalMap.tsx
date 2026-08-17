'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function GlobalMap() {
  const groupRef = useRef<THREE.Group>(null);

  const dots = useMemo(() => {
    // Generate points on a sphere to simulate a map projection
    const positions = [];
    const radius = 10;
    
    // Simple fibonacci sphere
    const samples = 2000;
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    
    for (let i = 0; i < samples; i++) {
      const y = 1 - (i / (samples - 1)) * 2; // y goes from 1 to -1
      const r = Math.sqrt(1 - y * y); // radius at y
      
      const theta = phi * i; // golden angle increment
      
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      
      // Introduce some "noise" to simulate continents vs oceans loosely
      const noise = Math.sin(x*3) * Math.cos(y*3) * Math.sin(z*3);
      if (noise > -0.2) {
        positions.push(x * radius, y * radius, z * radius);
      }
    }
    return new Float32Array(positions);
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group position={[0, -2, -15]} ref={groupRef}>
      <points>
        <bufferGeometry>
          <primitive object={new THREE.BufferAttribute(dots, 3)} attach="attributes-position" />
        </bufferGeometry>
        <pointsMaterial size={0.08} color="#00e5ff" transparent opacity={0.6} />
      </points>
      
      {/* Central glow */}
      <mesh>
        <sphereGeometry args={[9.5, 32, 32]} />
        <meshBasicMaterial color="#010308" />
      </mesh>
      
      <pointLight position={[0, 0, 0]} intensity={2} color="#00e5ff" distance={20} decay={2} />
    </group>
  );
}
