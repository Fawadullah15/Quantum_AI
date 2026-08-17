'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ARTIFACT_COUNT = 8;

export function SoftwareSpace() {
  const groupRef = useRef<THREE.Group>(null);

  const artifacts = useMemo(() => {
    return Array.from({ length: ARTIFACT_COUNT }).map((_, i) => {
      const angle = (i / ARTIFACT_COUNT) * Math.PI * 2;
      const radius = 12;
      return {
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * 6,
        z: Math.sin(angle) * radius,
        rotY: -angle + Math.PI / 2,
      };
    });
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= delta * 0.05; // Slow rotation of entire space
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {/* Central light source emitting from "the system" */}
      <pointLight position={[0, 0, 0]} intensity={2} color="#00e5ff" distance={40} decay={2} />
      
      {/* Central processing pillar */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1, 1, 40, 16]} />
        <meshStandardMaterial color="#010204" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Floating software UI artifacts */}
      {artifacts.map((pos, i) => (
        <SoftwareArtifact key={i} pos={pos} index={i} />
      ))}
    </group>
  );
}

function SoftwareArtifact({ pos, index }: { pos: any, index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create an abstract UI texture for the artifact
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, 512, 512);
    
    // Grid
    ctx.strokeStyle = '#1a2535';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }

    // Abstract data blocks
    ctx.fillStyle = '#00e5ff';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(32, 32, 200, 40);
    ctx.fillRect(32, 88, 120, 20);
    
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(32, 140 + i * 40, 448, 20);
    }

    // Code lines
    ctx.font = '16px monospace';
    ctx.fillStyle = '#445566';
    ctx.globalAlpha = 1.0;
    ctx.fillText(`SYS_MODULE // ${index}`, 32, 400);
    ctx.fillText('STATUS: OPERATIONAL', 32, 430);

    return new THREE.CanvasTexture(canvas);
  }, [index]);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating
      const t = state.clock.elapsedTime;
      meshRef.current.position.y = pos.y + Math.sin(t * 0.5 + index) * 0.5;
    }
  });

  return (
    <group position={[pos.x, pos.y, pos.z]} rotation={[0, pos.rotY, 0]}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[6.2, 6.2, 0.1]} />
        <meshStandardMaterial color="#020304" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Screen */}
      <mesh ref={meshRef} position={[0, 0, 0.06]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial 
          map={texture} 
          emissiveMap={texture} 
          emissive="#ffffff" 
          emissiveIntensity={0.2} 
          roughness={0} 
          metalness={1} 
        />
      </mesh>
    </group>
  );
}
