'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function AILaboratory() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  const particles = useMemo(() => {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 15;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = r * Math.sin(theta);
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.5;
      coreRef.current.rotation.x += delta * 0.2;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.x -= delta * 0.1;
      ringsRef.current.rotation.y -= delta * 0.15;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central Quantum / AI Core */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.9} />
        {/* Core Glow */}
        <mesh>
          <octahedronGeometry args={[1.6, 0]} />
          <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </mesh>
      </mesh>

      {/* Containment Rings */}
      <group ref={ringsRef}>
        {[4, 4.5, 5].map((radius, i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius, radius + 0.05, 64]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Data Streams */}
      <points>
        <bufferGeometry>
          <primitive object={new THREE.BufferAttribute(particles, 3)} attach="attributes-position" />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#00e5ff" transparent opacity={0.6} sizeAttenuation />
      </points>

      {/* Lab Environment lighting */}
      <pointLight position={[0, 0, 0]} intensity={3} color="#00e5ff" distance={20} decay={2} />
      <directionalLight position={[0, -10, 0]} intensity={1} color="#ffffff" />
    </group>
  );
}
