'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface IntelligenceCoreProps {
  mousePosition: { x: number; y: number };
  scrollProgress: number;
}

export function IntelligenceCore({ mousePosition, scrollProgress }: IntelligenceCoreProps) {
  const coreRef = useRef<THREE.Group>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);
  const fragmentsRef = useRef<THREE.Group>(null);
  const outerShellRef = useRef<THREE.Mesh>(null);
  const innerShellRef = useRef<THREE.Mesh>(null);

  const fragmentPositions = useMemo(() => {
    return Array.from({ length: 8 }).map(() => {
      const radius = 2 + Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
    });
  }, []);

  useFrame((state) => {
    if (!coreRef.current) return;
    const time = state.clock.getElapsedTime();

    // Rotate shells
    if (outerShellRef.current) {
      outerShellRef.current.rotation.y = time * 0.1;
      outerShellRef.current.rotation.x = time * 0.05;
    }
    if (innerShellRef.current) {
      innerShellRef.current.rotation.y = -time * 0.15;
      innerShellRef.current.rotation.z = time * 0.08;
    }

    // Pulse nucleus
    if (nucleusRef.current) {
      const mat = nucleusRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = 2 + Math.sin(time * 3) * 0.5;
      nucleusRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    }

    // Rotate energy rings at different speeds
    if (ringGroupRef.current) {
      ringGroupRef.current.children.forEach((ring, i) => {
        ring.rotation.x = time * (0.2 + i * 0.1);
        ring.rotation.y = time * (0.1 + i * 0.15);
      });
    }

    // Bob data fragments
    if (fragmentsRef.current) {
      fragmentsRef.current.rotation.y = time * 0.05;
      fragmentsRef.current.children.forEach((frag, i) => {
        if (frag instanceof THREE.Mesh) {
          frag.position.y += Math.sin(time * 2 + i) * 0.002;
          frag.lookAt(0, 0, 0);
        }
      });
    }

    // Mouse tilt
    const targetRotX = mousePosition.y * 0.2;
    const targetRotY = mousePosition.x * 0.2;
    coreRef.current.rotation.x = THREE.MathUtils.lerp(coreRef.current.rotation.x, targetRotX, 0.05);
    coreRef.current.rotation.z = THREE.MathUtils.lerp(coreRef.current.rotation.z, -targetRotY, 0.05);

    // Scroll separation effect
    if (scrollProgress > 0.45) {
      const sepFactor = Math.min(1, (scrollProgress - 0.45) * 3);
      if (outerShellRef.current) outerShellRef.current.scale.setScalar(1 - sepFactor * 0.8);
      if (innerShellRef.current) innerShellRef.current.scale.setScalar(1 - sepFactor * 0.8);
      coreRef.current.position.y = THREE.MathUtils.lerp(coreRef.current.position.y, 1, 0.1);
    } else {
      if (outerShellRef.current) outerShellRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      if (innerShellRef.current) innerShellRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      coreRef.current.position.y = THREE.MathUtils.lerp(coreRef.current.position.y, 0, 0.1);
    }
  });

  return (
    <group ref={coreRef}>
      {/* Outer Shell */}
      <mesh ref={outerShellRef}>
        <icosahedronGeometry args={[2, 2]} />
        <meshStandardMaterial 
          color="#00c8ff" 
          wireframe 
          transparent 
          opacity={0.15} 
        />
      </mesh>

      {/* Inner Shell */}
      <mesh ref={innerShellRef}>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshStandardMaterial 
          color="#7c3aed" 
          wireframe 
          transparent 
          opacity={0.25} 
        />
      </mesh>

      {/* Nucleus */}
      <mesh ref={nucleusRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          emissive="#00c8ff"
          emissiveIntensity={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Energy Rings */}
      <group ref={ringGroupRef}>
        {[0, 60, 120].map((angle, i) => (
          <mesh key={i} rotation={[0, (angle * Math.PI) / 180, 0]}>
            <torusGeometry args={[1.2, 0.01, 16, 100]} />
            <meshStandardMaterial 
              color="#00c8ff" 
              transparent 
              opacity={0.5} 
              emissive="#00c8ff" 
              emissiveIntensity={0.5} 
            />
          </mesh>
        ))}
      </group>

      {/* Data Fragments */}
      <group ref={fragmentsRef}>
        {fragmentPositions.map((pos, i) => (
          <group key={`frag-group-${i}`}>
            <mesh position={pos}>
              <planeGeometry args={[0.2, 0.08]} />
              <meshStandardMaterial 
                color="#00c8ff" 
                transparent 
                opacity={0.8}
                side={THREE.DoubleSide} 
              />
            </mesh>
            <Line
              points={[[0, 0, 0], pos.toArray()]}
              color="#00c8ff"
              transparent
              opacity={0.15}
              lineWidth={1}
            />
          </group>
        ))}
      </group>
    </group>
  );
}
