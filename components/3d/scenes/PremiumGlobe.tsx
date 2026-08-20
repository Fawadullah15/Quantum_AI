'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import countriesData from '@/lib/data/countries.js';
import geoBordersData from '@/lib/data/geo-borders.json';

const EARTH_RADIUS = 4.5;

// ── Major Global Hubs ────────────────────────────────────────────────────────
const HUBS = [
  { lat: 40.71, lng: -74.00, label: 'New York' },
  { lat: 37.77, lng: -122.41, label: 'San Francisco' },
  { lat: 51.50, lng: -0.12, label: 'London' },
  { lat: 48.85, lng: 2.35, label: 'Paris' },
  { lat: 25.20, lng: 55.27, label: 'Dubai' },
  { lat: 31.52, lng: 74.35, label: 'Lahore' },
  { lat: 1.35, lng: 103.81, label: 'Singapore' },
  { lat: 35.68, lng: 139.65, label: 'Tokyo' },
  { lat: -33.87, lng: 151.21, label: 'Sydney' },
];

const latLongToVector3 = (lat: number, lon: number, r: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
};

// ── Instant Synchronous Texture Generator ────────────────────────────────────
function createInstantMaskTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FFFFFF';

  const addPolygonToCtxPath = (polygon: number[][][]) => {
    polygon.forEach((ring) => {
      ring.forEach((coord, i) => {
        const x = ((coord[0] + 180) / 360) * canvas.width;
        const y = ((90 - coord[1]) / 180) * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    });
  };

  const features = (countriesData as any).features || [];
  features.forEach((feature: any) => {
    if (!feature || !feature.geometry) return;
    const type = feature.geometry.type;
    if (type === 'Polygon') {
      ctx.beginPath();
      addPolygonToCtxPath(feature.geometry.coordinates);
      ctx.fill('evenodd');
    } else if (type === 'MultiPolygon') {
      ctx.beginPath();
      feature.geometry.coordinates.forEach((poly: any) => addPolygonToCtxPath(poly));
      ctx.fill('evenodd');
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function PremiumGlobe() {
  const rootGroupRef = useRef<THREE.Group>(null);
  const tiltGroupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const mousePos = useRef({ x: 0, y: 0 });
  const scrollRef = useRef({ current: 0, target: 0, velocity: 0, lastY: 0 });
  const dragRef = useRef({ isDragging: false, prevX: 0, prevY: 0, dragRotX: 0, dragRotY: 0 });

  // 1. Instant Synchronous Precomputed Geo-Borders Buffer (10,312 segments)
  const geoBuffers = useMemo(() => {
    return {
      positions: new Float32Array(geoBordersData.positions),
      distances: new Float32Array(geoBordersData.distances),
      offsets: new Float32Array(geoBordersData.offsets),
    };
  }, []);

  // 2. Instant Synchronous Canvas Texture Mask
  const maskTexture = useMemo(() => createInstantMaskTexture(), []);

  useEffect(() => {
    if (spinGroupRef.current) {
      spinGroupRef.current.rotation.y = 1.35; // Start with luminous continents facing viewer
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (dragRef.current.isDragging) {
        const deltaX = e.clientX - dragRef.current.prevX;
        const deltaY = e.clientY - dragRef.current.prevY;
        dragRef.current.dragRotX += deltaX * 0.005;
        dragRef.current.dragRotY = Math.max(-0.4, Math.min(0.4, dragRef.current.dragRotY + deltaY * 0.003));
        dragRef.current.prevX = e.clientX;
        dragRef.current.prevY = e.clientY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Only drag on hero area
      if (window.scrollY < window.innerHeight * 1.2) {
        dragRef.current.isDragging = true;
        dragRef.current.prevX = e.clientX;
        dragRef.current.prevY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY || 0;
      const heroHeight = window.innerHeight || 800;
      const progress = scrollY / heroHeight;
      const diff = scrollY - scrollRef.current.lastY;
      scrollRef.current.velocity = diff * 0.003;
      scrollRef.current.lastY = scrollY;
      scrollRef.current.target = progress;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', listener);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScroll);
      media.removeEventListener('change', listener);
    };
  }, []);

  // 3. Dot Matrix Landmass Shader Uniforms
  const fillUniforms = useMemo(
    () => ({
      uMask: { value: maskTexture },
      uDotColor: { value: new THREE.Color('#FFFFFF') },
      uDotDensity: { value: 120.0 },
      uDotSize: { value: 0.42 },
      uGlowColor: { value: new THREE.Color('#0066FF') },
      uGlowIntensity: { value: 3.2 },
      uOceanColor: { value: new THREE.Color('#020817') },
      uOceanAlpha: { value: 0.96 },
    }),
    [maskTexture]
  );

  // 4. Luminous Traveling Cyan Border Pulses Uniforms
  const lineUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#00F0FF') },
    }),
    []
  );

  useFrame((state, delta) => {
    // Smooth scroll interpolation
    scrollRef.current.current += (scrollRef.current.target - scrollRef.current.current) * 0.07;
    const progress = scrollRef.current.current;

    // Pulse traveling border lines
    if (!reducedMotion) {
      lineUniforms.uTime.value += delta * 0.65;
    }

    // ── 3D Recede on Scroll (Zoom out on scroll down, Zoom in on scroll up) ──
    if (rootGroupRef.current) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      // When at hero (progress=0): Earth sits prominent in backdrop (z=0, scale=1.05)
      // As user scrolls down (progress increases): Earth smoothly recedes into deep space (z=-6.5, scale=0.7)
      // As user scrolls up: Earth zooms forward back to (z=0, scale=1.05)
      const targetZ = -progress * 5.5;
      const targetY = -progress * 4.0 + mousePos.current.y * 0.35 + dragRef.current.dragRotY;
      const targetX = isMobile ? 0 : 3.6 - Math.min(1, progress * 0.6) * 1.5 + mousePos.current.x * 0.45;

      const targetScale = 1.08 - Math.min(0.42, progress * 0.32);

      rootGroupRef.current.position.x = THREE.MathUtils.lerp(rootGroupRef.current.position.x, targetX, 0.08);
      rootGroupRef.current.position.y = THREE.MathUtils.lerp(rootGroupRef.current.position.y, targetY, 0.08);
      rootGroupRef.current.position.z = THREE.MathUtils.lerp(rootGroupRef.current.position.z, targetZ, 0.08);

      const s = THREE.MathUtils.lerp(rootGroupRef.current.scale.x, Math.max(0.62, targetScale), 0.08);
      rootGroupRef.current.scale.set(s, s, s);

      // Dynamic tilt on scroll
      rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.x,
        progress * 0.35 + mousePos.current.y * 0.12,
        0.06
      );
      rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.y,
        mousePos.current.x * 0.2,
        0.06
      );
    }

    // ── Continuous Planetary Spin with Drag & Scroll Velocity Boost ──
    if (spinGroupRef.current && !reducedMotion) {
      const scrollBoost = scrollRef.current.velocity * 0.7;
      const dragDelta = dragRef.current.dragRotX * 0.1;
      dragRef.current.dragRotX *= 0.9; // decay drag inertia

      spinGroupRef.current.rotation.y += delta * 0.05 + scrollBoost + dragDelta;
      scrollRef.current.velocity *= 0.92; // decay scroll velocity
    }
  });

  return (
    <group ref={rootGroupRef}>
      {/* 23.5° Earth Axial Tilt Group */}
      <group ref={tiltGroupRef} rotation={[0, 0, 23.5 * (Math.PI / 180)]}>
        {/* Continuous Spin Group */}
        <group ref={spinGroupRef}>
          {/* ── Base Dot-Matrix Landmass Sphere ── */}
          <mesh renderOrder={1}>
            <sphereGeometry args={[EARTH_RADIUS * 0.985, 64, 64]} />
            <shaderMaterial
              uniforms={fillUniforms}
              transparent
              depthWrite={false}
              depthTest={true}
              side={THREE.FrontSide}
              vertexShader={`
                varying vec3 vPosition;
                varying vec3 vNormal;
                void main() {
                  vPosition = position;
                  vNormal = normalize(normalMatrix * normal);
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform sampler2D uMask;
                uniform vec3 uDotColor;
                uniform float uDotDensity;
                uniform float uDotSize;
                uniform vec3 uGlowColor;
                uniform float uGlowIntensity;
                uniform vec3 uOceanColor;
                uniform float uOceanAlpha;
                
                varying vec3 vPosition;
                varying vec3 vNormal;

                void main() {
                  vec3 nPos = normalize(vPosition);
                  float phi = acos(clamp(nPos.y, -1.0, 1.0)); 
                  float theta = atan(nPos.z, -nPos.x);
                  
                  if (theta < 0.0) theta += 6.28318530718; 
                  float u = theta / 6.28318530718;
                  float v = 1.0 - (phi / 3.14159265359);
                  
                  // Fresnel edge inner glow
                  float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.8);
                  vec3 glow = uGlowColor * fresnel * uGlowIntensity;

                  float dotsRows = uDotDensity;
                  float vRow = floor(v * dotsRows) + 0.5;
                  float vCenter = vRow / dotsRows;
                  float phiCenter = vCenter * 3.14159265359;
                  float sinPhiCenter = max(sin(phiCenter), 0.001);
                  
                  float dotsCols = max(floor(dotsRows * 2.0 * sinPhiCenter), 1.0);
                  float uCol = floor(u * dotsCols) + 0.5;
                  float uCenter = uCol / dotsCols;
                  
                  vec4 centerMask = texture2D(uMask, vec2(uCenter, vCenter));
                  
                  float dPhi = (v - vCenter) * 3.14159265359;
                  float dTheta = fract(u - uCenter + 0.5) - 0.5;
                  dTheta *= 6.28318530718;
                  
                  float dx = dTheta * sinPhiCenter;
                  float dy = dPhi;
                  float dist = sqrt(dx*dx + dy*dy);
                  
                  float maxDist = (3.14159265359 / dotsRows) * 0.5 * uDotSize;
                  
                  vec3 finalColor = uOceanColor + glow * 0.45;
                  float finalAlpha = uOceanAlpha;
                  
                  if (centerMask.r > 0.5) {
                    float alpha = smoothstep(maxDist, maxDist * 0.72, dist);
                    vec3 dotColorWithGlow = uDotColor + glow * 0.9;
                    float edge = max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
                    dotColorWithGlow += vec3(0.3) * pow(edge, 2.2);
                    finalColor = mix(finalColor, dotColorWithGlow, alpha);
                    finalAlpha = max(uOceanAlpha, alpha);
                  }

                  gl_FragColor = vec4(finalColor, finalAlpha);
                }
              `}
            />
          </mesh>

          {/* ── High-Precision Animated Country Borders ── */}
          <lineSegments renderOrder={2}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[geoBuffers.positions, 3]}
              />
              <bufferAttribute
                attach="attributes-aDistance"
                args={[geoBuffers.distances, 1]}
              />
              <bufferAttribute
                attach="attributes-aOffset"
                args={[geoBuffers.offsets, 1]}
              />
            </bufferGeometry>
            <shaderMaterial
              uniforms={lineUniforms}
              transparent
              depthTest={true}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              vertexShader={`
                varying float vDistance;
                varying float vOffset;
                attribute float aDistance;
                attribute float aOffset;
                void main() {
                  vDistance = aDistance;
                  vOffset = aOffset;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform float uTime;
                uniform vec3 uColor;
                varying float vDistance;
                varying float vOffset;
                void main() {
                  float phase = fract(vDistance - uTime * 0.6 + vOffset);
                  float pulse = pow(phase, 4.0);
                  float alpha = 0.55 + pulse * 0.45;
                  gl_FragColor = vec4(uColor, alpha);
                }
              `}
            />
          </lineSegments>

          {/* ── Global Hub Nodes ── */}
          {HUBS.map((hub, idx) => {
            const pos = latLongToVector3(hub.lat, hub.lng, EARTH_RADIUS * 1.012);
            return (
              <group key={idx} position={pos}>
                <mesh renderOrder={3}>
                  <sphereGeometry args={[0.06, 16, 16]} />
                  <meshBasicMaterial color="#00F0FF" />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* ── Outer Atmospheric Halo ── */}
      <mesh renderOrder={0}>
        <sphereGeometry args={[EARTH_RADIUS * 1.15, 48, 48]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uColor: { value: new THREE.Color('#0055FF') },
          }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
              gl_FragColor = vec4(uColor, intensity * 0.9);
            }
          `}
        />
      </mesh>

      {/* ── Lighting ── */}
      <ambientLight intensity={0.3} color="#F8FAFC" />
      <directionalLight position={[-12, 6, 10]} intensity={2.2} color="#0099FF" />
      <directionalLight position={[12, -4, -10]} intensity={1.5} color="#0033BB" />
    </group>
  );
}
