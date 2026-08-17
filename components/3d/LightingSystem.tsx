'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LightingSystemProps {
  scrollProgress: number;
}

export function LightingSystem({ scrollProgress }: LightingSystemProps) {
  const cyanLightRef = useRef<THREE.PointLight>(null);
  const violetLightRef = useRef<THREE.PointLight>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (cyanLightRef.current) {
      cyanLightRef.current.position.x = Math.cos(time * 0.5) * 5;
      cyanLightRef.current.position.z = Math.sin(time * 0.5) * 5;
      cyanLightRef.current.intensity = 1.5 + Math.sin(time * 2) * 0.2 + scrollProgress * 0.5;
    }

    if (violetLightRef.current) {
      violetLightRef.current.position.x = Math.sin(time * 0.3) * -5;
      violetLightRef.current.position.z = Math.cos(time * 0.3) * -5;
      violetLightRef.current.intensity = 1.0 + Math.cos(time * 1.5) * 0.2 + scrollProgress * 0.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.1 + scrollProgress * 0.1} color="#030508" />
      <hemisphereLight 
        args={["#0d1e35", "#030508", 0.3 + scrollProgress * 0.2]} 
      />
      <pointLight 
        ref={cyanLightRef}
        color="#00c8ff" 
        intensity={1.5} 
        position={[5, 5, 5]} 
      />
      <pointLight 
        ref={violetLightRef}
        color="#7c3aed" 
        intensity={1.0} 
        position={[-5, -3, -5]} 
      />
      <directionalLight 
        ref={dirLightRef}
        color="#ffffff" 
        intensity={0.2} 
        position={[0, 10, 5]} 
      />
    </>
  );
}
