'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// The CEO presence: a large, dark silhouette with environmental lighting
function CEOPresence() {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <group position={[-10, 0, 0]}>
      {/* Abstract human-like monolith - CEO visual */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.6, 0.5, 10, 8]} />
        <meshStandardMaterial color="#010203" roughness={0.5} metalness={0.9} />
      </mesh>
      <mesh position={[0, 8.5, 0]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#010203" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Strategic light for CEO — white, cold */}
      <pointLight ref={lightRef} position={[0, 10, 5]} intensity={1.5} color="#ffffff" distance={20} decay={2} />
      <spotLight position={[10, 15, 5]} target-position={[0, 5, 0]} intensity={3} color="#ffffff" angle={0.3} penumbra={0.8} />
    </group>
  );
}

// The CTO presence: surrounded by spinning data rings
function CTOPresence() {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.3;
      ringsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  return (
    <group position={[10, 0, 0]}>
      {/* Abstract human-like monolith - CTO visual */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.6, 0.5, 10, 8]} />
        <meshStandardMaterial color="#010203" roughness={0.5} metalness={0.9} />
      </mesh>
      <mesh position={[0, 8.5, 0]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#010203" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Rotating data / tech rings — CTO's domain */}
      <group ref={ringsRef}>
        {[3, 4.5, 6].map((r, i) => (
          <mesh key={i} rotation={[i * 0.5, 0, i * 0.8]}>
            <ringGeometry args={[r, r + 0.06, 64]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.3 - i * 0.05} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Strategic light for CTO — cyan, technical */}
      <pointLight position={[0, 10, 5]} intensity={1.5} color="#00e5ff" distance={20} decay={2} />
    </group>
  );
}

// The intelligence core connecting them
function IntelligenceCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.Line>(null);

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.8;
      coreRef.current.rotation.x += delta * 0.3;
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  // A line connecting the two figures through the core
  const linePoints = [
    new THREE.Vector3(-10, 5, 0),
    new THREE.Vector3(0, 5, 0),
    new THREE.Vector3(10, 5, 0),
  ];
  const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);

  return (
    <group position={[0, 0, 0]}>
      {/* Central icosahedron core */}
      <mesh ref={coreRef} position={[0, 5, 0]}>
        <octahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial color="#000000" roughness={0} metalness={1} emissive="#00e5ff" emissiveIntensity={0.3} />
      </mesh>

      {/* Connection line */}
      <line geometry={lineGeom}>
        <lineBasicMaterial color="#00e5ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </line>

      {/* Core glow */}
      <pointLight position={[0, 5, 0]} intensity={5} color="#00e5ff" distance={30} decay={2} />
    </group>
  );
}

export function LeadershipCore() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, -5, -15]}>
      {/* Vast dark floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#010203" roughness={0.05} metalness={0.95} />
      </mesh>

      <CEOPresence />
      <CTOPresence />
      <IntelligenceCore />

      {/* Wide ambient for the space */}
      <ambientLight intensity={0.02} color="#000000" />
      <directionalLight position={[0, 30, 20]} intensity={0.5} color="#ffffff" />
    </group>
  );
}
