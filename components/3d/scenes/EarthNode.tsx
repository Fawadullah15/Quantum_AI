'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Basic spherical coordinate helper
function getSpherical(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Tech hubs coordinates
const HUBS = [
  { name: 'SF', lat: 37.77, lng: -122.41 },
  { name: 'NYC', lat: 40.71, lng: -74.00 },
  { name: 'LDN', lat: 51.50, lng: -0.12 },
  { name: 'TOK', lat: 35.67, lng: 139.65 },
  { name: 'SGP', lat: 1.35, lng: 103.81 },
];

export function EarthNode() {
  const groupRef = useRef<THREE.Group>(null);
  const earthRadius = 6;

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05; // Slow cinematic rotation
      // Add a slight bobbing motion
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* 
        The Earth Sphere 
        We use a dark standard material. Ideally, a high-res earth texture goes here.
        For now, we'll use a deep blackish blue base.
      */}
      <mesh>
        <sphereGeometry args={[earthRadius, 64, 64]} />
        <meshStandardMaterial 
          color="#010308" 
          roughness={0.7} 
          metalness={0.3} 
        />
      </mesh>

      {/* Atmospheric Glow */}
      <mesh>
        <sphereGeometry args={[earthRadius * 1.05, 64, 64]} />
        <meshBasicMaterial 
          color="#00e5ff" 
          transparent 
          opacity={0.08} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Data Nodes */}
      {HUBS.map((hub, i) => (
        <Node key={hub.name} hub={hub} radius={earthRadius} index={i} />
      ))}

      {/* Connection Arcs */}
      <Arc start={HUBS[0]} end={HUBS[1]} radius={earthRadius} />
      <Arc start={HUBS[1]} end={HUBS[2]} radius={earthRadius} />
      <Arc start={HUBS[2]} end={HUBS[4]} radius={earthRadius} />
      <Arc start={HUBS[4]} end={HUBS[3]} radius={earthRadius} />
      <Arc start={HUBS[3]} end={HUBS[0]} radius={earthRadius} />
      
      {/* Harsh technical lighting */}
      <directionalLight position={[-10, 5, 10]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[10, 0, -10]} intensity={3.0} color="#00e5ff" />
      <pointLight position={[0, 0, 15]} intensity={0.5} color="#ffffff" />
    </group>
  );
}

function Node({ hub, radius, index }: { hub: any, radius: number, index: number }) {
  const pos = getSpherical(hub.lat, hub.lng, radius);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Pulse effect
      const t = state.clock.elapsedTime * 2 + index;
      const s = 1 + Math.sin(t) * 0.3;
      meshRef.current.scale.set(s, s, s);
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.sin(t) * 0.5;
    }
  });

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent blending={THREE.AdditiveBlending} />
      </mesh>
      
      {/* Outer ring */}
      <mesh>
        <ringGeometry args={[0.1, 0.12, 16]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} side={THREE.DoubleSide} />
        {/* Billboard to camera */}
      </mesh>
    </group>
  );
}

function Arc({ start, end, radius }: { start: any, end: any, radius: number }) {
  const lineRef = useRef<THREE.Line>(null);

  const points = useMemo(() => {
    const vStart = getSpherical(start.lat, start.lng, radius);
    const vEnd = getSpherical(end.lat, end.lng, radius);
    
    // Create quadratic bezier curve outside the earth
    const distance = vStart.distanceTo(vEnd);
    const midPoint = vStart.clone().lerp(vEnd, 0.5);
    midPoint.normalize().multiplyScalar(radius + distance * 0.2); // arc height

    const curve = new THREE.QuadraticBezierCurve3(vStart, midPoint, vEnd);
    return curve.getPoints(50);
  }, [start, end, radius]);

  const geom = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  useFrame((state) => {
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <line ref={lineRef} geometry={geom}>
      <lineBasicMaterial color="#00e5ff" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
    </line>
  );
}
