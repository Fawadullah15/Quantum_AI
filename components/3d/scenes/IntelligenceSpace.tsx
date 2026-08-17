'use client';

/**
 * IntelligenceSpace — The massive gallery deep in the Z-axis.
 * Extremely spaced out monolithic glass panels and minimalist UI rings.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SYSTEMS = [
  { id: 'sys_01', label: 'AI AGENTS', z: -20, x: -8 },
  { id: 'sys_02', label: 'RAG ARCHITECTURE', z: -45, x: 10 },
  { id: 'sys_03', label: 'WORKFLOW AUTOMATION', z: -70, x: -12 },
  { id: 'sys_04', label: 'CUSTOM SOFTWARE', z: -95, x: 8 },
  { id: 'sys_05', label: 'DATA INFRASTRUCTURE', z: -120, x: -10 },
  { id: 'sys_06', label: 'COMPUTER VISION', z: -145, x: 12 },
];

export function IntelligenceSpace({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {SYSTEMS.map((sys, index) => (
        <SystemMonolith 
          key={sys.id}
          index={index}
          label={sys.label}
          position={[sys.x, 0, sys.z]}
        />
      ))}
      
      {/* Distant light core */}
      <pointLight position={[0, 0, -180]} intensity={10} color="#00e5ff" distance={100} decay={2} />
    </group>
  );
}

function SystemMonolith({ 
  position, 
  label, 
  index 
}: { 
  position: [number, number, number]; 
  label: string;
  index: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create stark typography texture
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Abstract sharp tech rings
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(512, 512, 400, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#00e5ff';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(512, 512, 420, Math.PI * 1.5, Math.PI * 1.7);
    ctx.stroke();

    ctx.globalAlpha = 1.0;
    ctx.font = 'bold 80px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`0${index + 1}`, 512, 420);
    
    ctx.font = 'bold 60px sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText(label, 512, 530);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, [label, index]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Very subtle slow levitation to feel massive
    groupRef.current.position.y = Math.sin(t * 0.5 + index) * 0.5;
    // Subtly rotate toward the camera path (z-axis)
    const targetRotY = position[0] > 0 ? -0.2 : 0.2;
    groupRef.current.rotation.y = targetRotY;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Massive dark glass monolith */}
      <mesh>
        <boxGeometry args={[14, 14, 0.2]} />
        <meshStandardMaterial 
          color="#020202"
          roughness={0.1}
          metalness={0.9}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      
      {/* Emissive UI overlay */}
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[13.5, 13.5]} />
        <meshStandardMaterial 
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.8}
          transparent={true}
          depthWrite={false}
        />
      </mesh>
      
      {/* Subdued monolithic lighting */}
      <pointLight position={[0, 0, 2]} intensity={2} color="#00e5ff" distance={15} decay={2} />
    </group>
  );
}
