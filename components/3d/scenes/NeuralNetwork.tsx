'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NODE_COUNT = 300;
const LINE_COUNT = 400;

export function NeuralNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const { nodePositions, lineIndices } = useMemo(() => {
    const positions = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i++) {
      // Cluster more around center
      const r = Math.pow(Math.random(), 1.5) * 20;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    const indices = [];
    for (let i = 0; i < LINE_COUNT; i++) {
      const a = Math.floor(Math.random() * NODE_COUNT);
      // Connect mostly to nearby nodes (simplified by connecting to random for now)
      const b = Math.floor(Math.random() * NODE_COUNT);
      indices.push(a, b);
    }

    return { nodePositions: positions, lineIndices: new Uint16Array(indices) };
  }, []);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    geometry.setIndex(new THREE.BufferAttribute(lineIndices, 1));
    return geometry;
  }, [nodePositions, lineIndices]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Central Core */}
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#02050a" roughness={0.2} metalness={0.8} />
      </mesh>
      
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Scattered Nodes */}
      <points>
        <bufferGeometry>
          <primitive object={new THREE.BufferAttribute(nodePositions, 3)} attach="attributes-position" />
        </bufferGeometry>
        <pointsMaterial size={0.15} color="#ffffff" transparent opacity={0.8} sizeAttenuation />
      </points>

      {/* Network Lines */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#00e5ff" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </lineSegments>
      
      <pointLight position={[0, 0, 0]} intensity={4} color="#00e5ff" distance={30} decay={2} />
    </group>
  );
}
