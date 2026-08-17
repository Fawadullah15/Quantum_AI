'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';

interface DataNetworkProps {
  visible: boolean;
  scrollProgress: number;
  labels: string[];
}

export function DataNetwork({ visible, scrollProgress, labels }: DataNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  const nodeCount = 12;
  
  // Generate stable random positions
  const nodes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < nodeCount; i++) {
      arr.push(new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      ));
    }
    return arr;
  }, []);

  const edges = useMemo(() => {
    const lines = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 4.5) {
          lines.push([nodes[i], nodes[j]]);
        }
      }
    }
    return lines;
  }, [nodes]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Scale animation based on visibility and scroll
    const targetScale = visible ? 1 : 0;
    
    // Calculate appearance multiplier based on scroll progress (0.15 to 0.35)
    let appearance = 0;
    if (scrollProgress > 0.15) {
      appearance = Math.min(1, (scrollProgress - 0.15) * 5); // 1 / 0.2 = 5
    }
    
    const finalScale = targetScale * appearance;
    groupRef.current.scale.lerp(new THREE.Vector3(finalScale, finalScale, finalScale), 0.1);
    
    // Slowly rotate the entire network
    groupRef.current.rotation.y = time * 0.05;
    
    // Pulse nodes
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const pulse = 1 + Math.sin(time * 2 + i) * 0.2;
        child.scale.set(pulse, pulse, pulse);
      }
    });
  });

  return (
    <group ref={groupRef} scale={[0,0,0]}>
      {nodes.map((pos, i) => (
        <group key={`node-group-${i}`} position={pos}>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial 
              color="#00c8ff" 
              emissive="#00c8ff" 
              emissiveIntensity={1} 
              transparent 
              opacity={0.8} 
            />
          </mesh>
          {labels[i] && (
            <Text
              position={[0, 0.2, 0]}
              fontSize={0.15}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              {labels[i]}
            </Text>
          )}
        </group>
      ))}
      
      {edges.map((edge, i) => (
        <Line 
          key={`edge-${i}`}
          points={[edge[0].toArray(), edge[1].toArray()]}
          color="#00c8ff"
          lineWidth={0.5}
          transparent
          opacity={0.2}
        />
      ))}
    </group>
  );
}
