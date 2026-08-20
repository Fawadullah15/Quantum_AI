'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Geographic Dot Grid ───────────────────────────────────────────────────────
// We generate a point cloud that approximates continents using a land-mask
// approach: a simplified set of bounding boxes per continent.
const LAND_REGIONS = [
  // North America
  { latMin: 25, latMax: 70, lngMin: -140, lngMax: -55 },
  // South America
  { latMin: -55, latMax: 15, lngMin: -80, lngMax: -35 },
  // Europe
  { latMin: 35, latMax: 70, lngMin: -10, lngMax: 40 },
  // Africa
  { latMin: -35, latMax: 37, lngMin: -20, lngMax: 52 },
  // Asia
  { latMin: 10, latMax: 75, lngMin: 40, lngMax: 145 },
  // Southeast Asia / Oceania islands
  { latMin: -10, latMax: 20, lngMin: 95, lngMax: 150 },
  // Australia
  { latMin: -40, latMax: -10, lngMin: 113, lngMax: 155 },
  // Greenland
  { latMin: 60, latMax: 85, lngMin: -55, lngMax: -15 },
];

function isOnLand(lat: number, lng: number): boolean {
  for (const r of LAND_REGIONS) {
    if (lat >= r.latMin && lat <= r.latMax && lng >= r.lngMin && lng <= r.lngMax) {
      return true;
    }
  }
  return false;
}

function latLngToXYZ(lat: number, lng: number, r: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

// ── Major city hubs ───────────────────────────────────────────────────────────
const HUBS = [
  { lat: 40.71,  lng: -74.00 },  // New York
  { lat: 51.50,  lng:  -0.12 },  // London
  { lat: 48.85,  lng:   2.35 },  // Paris
  { lat: 35.68,  lng: 139.65 },  // Tokyo
  { lat:  1.35,  lng: 103.81 },  // Singapore
  { lat: 25.20,  lng:  55.27 },  // Dubai
  { lat: 37.77,  lng: -122.41 }, // San Francisco
  { lat: -33.87, lng: 151.21 },  // Sydney
];

const ARCS = [
  [0, 1], [1, 2], [1, 5], [0, 6], [2, 4], [4, 3], [4, 7], [5, 4],
];

const EARTH_RADIUS = 4.2;
const DOT_COUNT    = 6000;
const DOT_SIZE     = 0.022;

// ── Arc curve builder ─────────────────────────────────────────────────────────
function buildArc(a: [number, number], b: [number, number], r: number, segments = 60) {
  const p0 = new THREE.Vector3(...latLngToXYZ(a[0], a[1], r));
  const p1 = new THREE.Vector3(...latLngToXYZ(b[0], b[1], r));
  const mid = p0.clone().lerp(p1, 0.5);
  mid.normalize().multiplyScalar(r * 1.25); // lift arc above surface
  const curve = new THREE.QuadraticBezierCurve3(p0, mid, p1);
  return curve.getPoints(segments);
}

// ── Components ────────────────────────────────────────────────────────────────

function GlobeDots() {
  const positions = useMemo(() => {
    const arr: number[] = [];
    let attempts = 0;
    const needed = typeof window !== 'undefined' && window.innerWidth < 768 ? 3000 : DOT_COUNT;
    while (arr.length / 3 < needed && attempts < needed * 20) {
      attempts++;
      const lat = (Math.random() * 180) - 90;
      const lng = (Math.random() * 360) - 180;
      if (!isOnLand(lat, lng)) continue;
      const [x, y, z] = latLngToXYZ(lat, lng, EARTH_RADIUS * 1.005);
      arr.push(x, y, z);
    }
    return new Float32Array(arr);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={DOT_SIZE}
        color="#48D7FF"
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
}

function HubNode({ lat, lng, idx }: { lat: number; lng: number; idx: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pos = latLngToXYZ(lat, lng, EARTH_RADIUS * 1.01);

  useFrame((state) => {
    const t = state.clock.elapsedTime + idx * 0.9;
    const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (meshRef.current) {
      const s = isReduced ? 1.0 : (1 + Math.sin(t * 2.0) * 0.4);
      meshRef.current.scale.setScalar(s);
      
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        const isFlaring = !isReduced && Math.sin(t * 0.5) > 0.85;
        if (isFlaring) {
          mat.color.setRGB(1.5, 2.5, 3.0); // Bright electric cyan flare
        } else {
          mat.color.setRGB(1.0, 1.0, 1.0); // Standard off-white
        }
      }
    }
    if (ringRef.current) {
      const s2 = isReduced ? 1.0 : (1 + Math.sin(t * 2.0 + 0.5) * 0.6);
      ringRef.current.scale.setScalar(s2);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        isReduced ? 0.2 : (0.15 + Math.sin(t * 2.0) * 0.1);
    }
  });

  const normal = new THREE.Vector3(...pos).normalize();
  const euler = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
  );

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color="#22D3EE" transparent opacity={0.9} />
      </mesh>
      <mesh ref={ringRef} rotation={euler}>
        <ringGeometry args={[0.055, 0.075, 24]} />
        <meshBasicMaterial
          color="#3B82F6"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function ConnectionArc({
  a, b, idx,
}: {
  a: [number, number];
  b: [number, number];
  idx: number;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const geom = useMemo(() => {
    const pts = buildArc(a, b, EARTH_RADIUS);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [a, b]);

  useFrame((state) => {
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      const t = state.clock.elapsedTime * 0.6 + idx * 1.1;
      mat.opacity = 0.08 + Math.sin(t) * 0.08;
    }
  });

  return (
    // @ts-ignore
    <line ref={lineRef} geometry={geom}>
      <lineBasicMaterial
        color="#4F46E5"
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
}

// ── Main globe export ─────────────────────────────────────────────────────────
export function PremiumGlobe() {
  const groupRef = useRef<THREE.Group>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const scrollRef = useRef({ current: 0, target: 0, velocity: 0, lastY: 0 });

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollRange = Math.max(window.innerHeight * 1.2, 600);
      scrollRef.current.target = Math.min(Math.max(scrollY / scrollRange, 0), 1);
      const diff = scrollY - scrollRef.current.lastY;
      scrollRef.current.velocity = diff * 0.0025;
      scrollRef.current.lastY = scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      media.removeEventListener('change', listener);
    };
  }, []);

  useFrame((state, delta) => {
    // Spring physics for smooth scroll responsiveness
    scrollRef.current.current += (scrollRef.current.target - scrollRef.current.current) * 0.06;
    const progress = scrollRef.current.current;

    if (groupRef.current) {
      if (!reducedMotion) {
        const boost = scrollRef.current.velocity * 0.85;
        groupRef.current.rotation.y += delta * 0.05 + boost;
        scrollRef.current.velocity *= 0.90;
      }

      // ── Smooth Near / Far 3D Scroll Depth (Matching Technologies Experience) ──
      // Top of Page (progress = 0):
      // Earth is near, large, front and center (z = 0, y = -0.5, scale = 1.0)
      // As user scrolls down (progress -> 1):
      // 1. Z recedes deeply into the background (targetZ = -progress * 11.0) -> Goes far away!
      // 2. Scale eases down smoothly (targetScale = 1.0 - progress * 0.35)
      // 3. Y stays centered in the viewport with subtle settling (targetY = -0.5 - progress * 0.6)
      // When user scrolls up (progress -> 0):
      // Earth smoothly zooms forward from deep space and returns close to the screen!
      const targetZ = -progress * 11.0;
      const targetY = -0.5 - progress * 0.6;
      const targetScale = Math.max(0.55, 1.0 - progress * 0.35);

      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.06);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.06);

      const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.06);
      groupRef.current.scale.set(s, s, s);

      // Subtle dynamic tilt with time and scroll
      groupRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.15) * 0.04 + progress * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── Ocean sphere ── */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#040f24"
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>

      {/* ── Land dot grid ── */}
      <GlobeDots />

      {/* ── Connection arcs ── */}
      {ARCS.map(([ai, bi], i) => (
        <ConnectionArc
          key={i}
          idx={i}
          a={[HUBS[ai].lat, HUBS[ai].lng]}
          b={[HUBS[bi].lat, HUBS[bi].lng]}
        />
      ))}

      {/* ── Hub nodes ── */}
      {HUBS.map((h, i) => (
        <HubNode key={i} lat={h.lat} lng={h.lng} idx={i} />
      ))}

      {/* ── Inner glow (atmosphere, inner) ── */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.015, 64, 64]} />
        <meshBasicMaterial
          color="#3730A3"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── Outer atmospheric halo ── */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.1, 64, 64]} />
        <meshBasicMaterial
          color="#4F46E5"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ── Second, softer halo ring ── */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.2, 32, 32]} />
        <meshBasicMaterial
          color="#24A8FF"
          transparent
          opacity={0.025}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ── Lighting ── */}
      <ambientLight intensity={0.15} color="#F8FAFC" />
      {/* Blue primary light */}
      <directionalLight position={[-12, 6, 10]} intensity={1.5} color="#2563EB" />
      {/* Deep indigo secondary light */}
      <directionalLight position={[12, -4, -10]} intensity={1.2} color="#3730A3" />
      {/* Very subtle violet rim light */}
      <directionalLight position={[0, 10, -15]} intensity={0.6} color="#7C3AED" />
    </group>
  );
}
