'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useGlobalStore } from '../../layout/GlobalStore';

const SYSTEM_NODES = [
  'AI AGENTS', 'MACHINE LEARNING', 'COMPUTER VISION',
  'RAG SYSTEMS', 'AUTOMATION', 'AI INFRASTRUCTURE'
];

export function SystemsNodes({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const { currentScene, scrollProgress } = useGlobalStore();

  return (
    <group position={position} ref={groupRef}>
      <Text position={[0, 5, 0]} fontSize={1} color="#ffffff" letterSpacing={0.2} anchorX="center">
        SYSTEMS
      </Text>
      {SYSTEM_NODES.map((sys, i) => {
        const angle = (i / SYSTEM_NODES.length) * Math.PI * 2;
        const x = Math.cos(angle) * 6;
        const y = Math.sin(angle) * 4;
        return <SystemNode key={sys} label={sys} position={[x, y, 0]} />;
      })}
    </group>
  );
}

function SystemNode({ label, position }: { label: string, position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group position={position}>
      <group ref={ref}>
        {/* Core */}
        <mesh>
          <octahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Wireframe shell */}
        <mesh>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial 
            ref={materialRef} 
            color="#7c3aed" 
            emissive="#7c3aed" 
            emissiveIntensity={0.5} 
            wireframe 
          />
        </mesh>
      </group>
      
      <Text position={[0, -1.5, 0]} fontSize={0.3} color="#ffffff" anchorX="center">
        {label}
      </Text>
      
      {/* Connection line back to center */}
      <Line 
        points={[[0, 0, 0], [0 - position[0], 0 - position[1], 0]]} 
        color="#4f46e5" 
        transparent 
        opacity={0.3} 
        lineWidth={1}
      />
    </group>
  );
}
