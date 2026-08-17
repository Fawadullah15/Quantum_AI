'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';

interface SystemNodesProps {
  active: boolean;
  scrollProgress: number;
  systems?: string[];
}

const DEFAULT_SYSTEMS = [
  'AI AGENTS',
  'MACHINE LEARNING',
  'COMPUTER VISION',
  'RAG SYSTEMS',
  'AUTOMATION',
  'AI INFRASTRUCTURE'
];

const TARGET_POSITIONS = [
  new THREE.Vector3(3, 1, 0),
  new THREE.Vector3(-3, 1, 0),
  new THREE.Vector3(0, 3, -1),
  new THREE.Vector3(2, -2, 1),
  new THREE.Vector3(-2, -2, 1),
  new THREE.Vector3(0, -1, 3)
];

const NODE_COUNT = 6;

export function SystemNodes({ active, scrollProgress, systems = DEFAULT_SYSTEMS }: SystemNodesProps) {
  const groupRef = useRef<THREE.Group>(null);

  // ✅ Fix: Single ref holding an array — no hooks inside callbacks
  const nodeRefs = useRef<(THREE.Group | null)[]>(Array(NODE_COUNT).fill(null));

  // ✅ Fix: useMemo at top level only — no hooks inside
  const currentPositions = useMemo(
    () => Array.from({ length: NODE_COUNT }).map(() => new THREE.Vector3(0, 0, 0)),
    []
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < NODE_COUNT; i++) {
      const ref = nodeRefs.current[i];
      if (!ref) continue;

      // Target position is origin if inactive, or specific target if active
      const targetPos = active ? TARGET_POSITIONS[i] : new THREE.Vector3(0, 0, 0);

      // Lerp position
      currentPositions[i].lerp(targetPos, 0.05);
      ref.position.copy(currentPositions[i]);

      // Add floating animation if active and near target
      if (active && currentPositions[i].distanceTo(targetPos) < 0.1) {
        ref.position.y += Math.sin(time * 2 + i) * 0.005;
      }

      // Rotate the first child mesh
      const mesh = ref.children[0] as THREE.Mesh | undefined;
      if (mesh) {
        mesh.rotation.y = time * 0.5;
        mesh.rotation.x = time * 0.3;
      }

      // Scale visibility
      const distFromOrigin = currentPositions[i].distanceTo(new THREE.Vector3(0, 0, 0));
      const scale = active ? 1 : Math.max(0, distFromOrigin * 0.5);
      ref.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef}>
      {systems.slice(0, NODE_COUNT).map((sys, i) => (
        <group
          key={`sys-node-${i}`}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
        >
          {/* Solid octahedron */}
          <mesh>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial
              color="#7c3aed"
              emissive="#7c3aed"
              emissiveIntensity={1.5}
              wireframe={false}
            />
          </mesh>
          {/* Wireframe shell */}
          <mesh scale={1.2}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial
              color="#7c3aed"
              wireframe={true}
              transparent
              opacity={0.5}
            />
          </mesh>
          {/* Label */}
          <Text
            position={[0, 0.6, 0]}
            fontSize={0.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {sys}
          </Text>
        </group>
      ))}

      {/* Connecting lines from origin to each node position */}
      {active && systems.slice(0, NODE_COUNT).map((_, i) => (
        <ConnectingLine
          key={`line-${i}`}
          start={new THREE.Vector3(0, 0, 0)}
          endPosRef={currentPositions[i]}
          active={active}
        />
      ))}
    </group>
  );
}

interface ConnectingLineProps {
  start: THREE.Vector3;
  endPosRef: THREE.Vector3;
  active: boolean;
}

function ConnectingLine({ start, endPosRef, active }: ConnectingLineProps) {
  const lineRef = useRef<any>(null);

  useFrame(() => {
    // Line points are static per render; dynamic update handled by R3F reconciler
  });

  const opacity = active ? 0.3 : 0;

  return (
    <Line
      ref={lineRef}
      points={[start.toArray(), endPosRef.toArray()]}
      color="#7c3aed"
      lineWidth={1}
      transparent
      opacity={opacity}
    />
  );
}
