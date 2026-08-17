'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function WorkGallery({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  return (
    <group position={position} ref={groupRef}>
      <Text position={[0, 6, -2]} fontSize={1.2} color="#ffffff" letterSpacing={0.2} anchorX="center">
        WORK
      </Text>

      {/* Cinematic Case Study Panels */}
      <CaseStudyPanel position={[-4, 0, 1]} rotation={[0, 0.2, 0]} title="PROJECT ALPHA" subtitle="AI Automation" />
      <CaseStudyPanel position={[0, 0, 3]} rotation={[0, 0, 0]} title="FINANCE CORE" subtitle="Predictive Models" />
      <CaseStudyPanel position={[4, 0, 1]} rotation={[0, -0.2, 0]} title="VISION SYS" subtitle="Computer Vision" />
    </group>
  );
}

function CaseStudyPanel({ position, rotation, title, subtitle }: { position: [number, number, number], rotation: [number, number, number], title: string, subtitle: string }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      // Very slight parallax
      const mouseX = (state.pointer.x * Math.PI) / 40;
      ref.current.rotation.y = rotation[1] + mouseX;
    }
  });

  return (
    <group position={position} rotation={rotation} ref={ref}>
      <mesh>
        <planeGeometry args={[3.5, 5]} />
        <meshStandardMaterial color="#0a0a0f" roughness={0.4} metalness={0.5} />
      </mesh>
      
      {/* Cinematic border */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[3.6, 5.1]} />
        <meshBasicMaterial color="#333344" />
      </mesh>

      <Text position={[0, 1.5, 0.01]} fontSize={0.3} color="#ffffff" anchorX="center">
        {title}
      </Text>
      <Text position={[0, 1.0, 0.01]} fontSize={0.15} color="#8a9bb0" anchorX="center">
        {subtitle}
      </Text>
      
      {/* Abstract visual placeholder for project imagery */}
      <mesh position={[0, -0.5, 0.01]}>
        <planeGeometry args={[2.8, 2.8]} />
        <meshStandardMaterial color="#11111a" />
      </mesh>
    </group>
  );
}
