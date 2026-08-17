'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function RealisticEarth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Group>(null);
  const radius = 6;

  // Generate some procedural "continents" or abstract shapes using small dots on the surface
  const dots = useMemo(() => {
    const positions = [];
    const samples = 4000;
    const phi = Math.PI * (3 - Math.sqrt(5));
    
    for (let i = 0; i < samples; i++) {
      const y = 1 - (i / (samples - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      
      // Abstract noise to simulate continents
      const noise = Math.sin(x * 5) * Math.cos(y * 4) * Math.sin(z * 5);
      if (noise > 0.1) {
        positions.push(x * radius * 1.01, y * radius * 1.01, z * radius * 1.01);
      }
    }
    return new Float32Array(positions);
  }, [radius]);

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += delta * 0.05;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.06;
      cloudsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group position={[0, -1, 0]}>
      {/* Base Earth Sphere - Deep Ocean Blue */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial 
          color="#06152B" 
          roughness={0.6} 
          metalness={0.1} 
        />
      </mesh>

      {/* Abstract Landmass / Lights */}
      <group ref={cloudsRef}>
        <points>
          <bufferGeometry>
            <primitive object={new THREE.BufferAttribute(dots, 3)} attach="attributes-position" />
          </bufferGeometry>
          <pointsMaterial size={0.04} color="#48D7FF" transparent opacity={0.6} />
        </points>
      </group>

      {/* Soft Atmosphere Glow */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[radius * 1.08, 64, 64]} />
        <meshBasicMaterial 
          color="#1677FF" 
          transparent 
          opacity={0.1} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Lighting to create the day/night terminator line */}
      <ambientLight intensity={0.2} color="#F8FAFF" />
      <directionalLight position={[-15, 5, 10]} intensity={1.5} color="#F8FAFF" />
      <directionalLight position={[15, 0, -15]} intensity={0.5} color="#1677FF" />
    </group>
  );
}
