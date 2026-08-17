'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NODE_COUNT = 30;

export function SignalNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<{ progress: number; active: boolean }>({ progress: 0, active: false });

  // Expose a trigger for form submission
  if (typeof window !== 'undefined') {
    (window as any).__triggerSignalPulse = () => {
      pulseRef.current = { progress: 0, active: true };
    };
  }

  const { nodePositions, lineSegments } = useMemo(() => {
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
      const angle = (i / NODE_COUNT) * Math.PI * 2;
      const r = 5 + Math.random() * 10;
      return new THREE.Vector3(
        Math.cos(angle) * r + (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8,
        Math.sin(angle) * r + (Math.random() - 0.5) * 4
      );
    });

    const positions: number[] = [];
    const connectedPairs: [number, number][] = [];

    // Connect each node to 2-3 nearest neighbors
    for (let i = 0; i < nodes.length; i++) {
      const distances = nodes.map((n, j) => ({ j, d: nodes[i].distanceTo(n) })).sort((a, b) => a.d - b.d);
      for (let k = 1; k <= 2; k++) {
        const neighbor = distances[k];
        positions.push(nodes[i].x, nodes[i].y, nodes[i].z);
        positions.push(nodes[neighbor.j].x, nodes[neighbor.j].y, nodes[neighbor.j].z);
        connectedPairs.push([i, neighbor.j]);
      }
    }

    return { nodePositions: nodes, lineSegments: new Float32Array(positions) };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, -8]}>
      {/* Network nodes */}
      {nodePositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0} metalness={1} emissive="#00e5ff" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Network lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lineSegments, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#00e5ff" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </lineSegments>

      {/* Central transmitter */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#000000" roughness={0} metalness={1} emissive="#00e5ff" emissiveIntensity={1} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2} color="#00e5ff" distance={25} decay={2} />
    </group>
  );
}
