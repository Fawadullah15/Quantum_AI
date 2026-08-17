'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';

const TECHNOLOGIES = [
  'Python', 'TypeScript', 'React', 'Next.js', 'FastAPI', 
  'Node.js', 'PostgreSQL', 'Prisma', 'LangChain', 'AWS', 'Docker'
];

export function TechnologyNetwork({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate random positions for the nodes
  const nodes = useMemo(() => {
    return TECHNOLOGIES.map((tech) => {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 4 + Math.random() * 2;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      return { label: tech, pos: [x, y, z] as [number, number, number] };
    });
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      groupRef.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group position={position}>
      <Text position={[0, 6, 0]} fontSize={1} color="#ffffff" letterSpacing={0.2} anchorX="center">
        TECHNOLOGY
      </Text>
      
      <group ref={groupRef}>
        {nodes.map((node, i) => (
          <TechNode key={node.label} data={node} />
        ))}

        {/* Generate connecting lines between nodes */}
        {nodes.map((n1, i) => 
          nodes.slice(i + 1).map((n2, j) => {
            // Only connect if distance is relatively small to form a network
            const dist = new THREE.Vector3(...n1.pos).distanceTo(new THREE.Vector3(...n2.pos));
            if (dist < 6) {
              return (
                <Line 
                  key={`${i}-${j}`} 
                  points={[n1.pos, n2.pos]} 
                  color="#4f46e5" 
                  transparent 
                  opacity={0.15} 
                  lineWidth={1}
                />
              );
            }
            return null;
          })
        )}
      </group>
    </group>
  );
}

function TechNode({ data }: { data: { label: string, pos: [number, number, number] } }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      // Counter-rotate the text so it always faces the camera
      ref.current.quaternion.copy(state.camera.quaternion);
    }
  });

  return (
    <group position={data.pos}>
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.4} />
      </mesh>
      
      <group ref={ref}>
        <Text position={[0, -0.4, 0]} fontSize={0.25} color="#a5b4fc" anchorX="center">
          {data.label}
        </Text>
      </group>
    </group>
  );
}
