'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleSystemProps {
  count?: number;
  scrollProgress: number;
  mousePosition: { x: number; y: number };
}

export function ParticleSystem({ count = 800, scrollProgress, mousePosition }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 2 + Math.random() * 6; // Spread radius ~8 (2 to 8)
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particlesPosition, 3));
    return geo;
  }, [particlesPosition]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Slow rotation
    pointsRef.current.rotation.y = time * 0.05;
    pointsRef.current.rotation.x = time * 0.02;
    
    // Pulse size slightly based on time
    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.size = 0.05 + Math.sin(time * 2) * 0.02;

    // Outward flow on scroll
    let scale = 1;
    if (scrollProgress > 0.15) {
      const factor = (scrollProgress - 0.15) * 2;
      scale = 1 + factor * 1.5;
    }
    
    // Parallax
    const targetX = mousePosition.x * 0.5;
    const targetY = mousePosition.y * 0.5;
    
    pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, targetX, 0.05);
    pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, targetY, 0.05);
    
    pointsRef.current.scale.set(scale, scale, scale);
  });

  if (count === 0) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial 
        color="#00c8ff" 
        size={0.05} 
        transparent 
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
