'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import countriesData from '@/lib/data/countries.js';
import geoBordersData from '@/lib/data/geo-borders.json';

const EARTH_RADIUS = 5.6;

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
  const hubRingsRef = useRef<THREE.Group>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const mousePos = useRef({ x: 0, y: 0 });
  const scrollRef = useRef({ current: 0, target: 0, velocity: 0, lastY: 0 });

  // 1. Precomputed Geo-Borders Buffer (10,312 segments at R=5.6)
  const geoBuffers = useMemo(() => {
    return {
      positions: new Float32Array(geoBordersData.positions),
      distances: new Float32Array(geoBordersData.distances),
      offsets: new Float32Array(geoBordersData.offsets),
    };
  }, []);

  // 2. Synchronous Canvas Texture Mask
  const maskTexture = useMemo(() => createInstantMaskTexture(), []);

  useEffect(() => {
    // Initial longitude orientation: populated continents face forward
    if (spinGroupRef.current) {
      spinGroupRef.current.rotation.y = 1.35;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
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
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', listener);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      media.removeEventListener('change', listener);
    };
  }, []);

  // 3. Rich Surface & Landmass Shader Uniforms
  const fillUniforms = useMemo(
    () => ({
      uMask: { value: maskTexture },
      uDotColor: { value: new THREE.Color('#FFFFFF') },
      uDotDensity: { value: 125.0 },
      uDotSize: { value: 0.42 },
      uGlowColor: { value: new THREE.Color('#0066FF') },
      uGlowIntensity: { value: 2.4 },
      uOceanColor: { value: new THREE.Color('#020713') },
      uLandBaseColor: { value: new THREE.Color('#081B38') },
      uOceanAlpha: { value: 0.96 },
    }),
    [maskTexture]
  );

  // 4. Vibrant Traveling Cyan Border Pulses Uniforms
  const lineUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#00F0FF') },
    }),
    []
  );

  useFrame((state, delta) => {
    // Smooth scroll interpolation (Antigravity spring physics)
    scrollRef.current.current += (scrollRef.current.target - scrollRef.current.current) * 0.07;
    const progress = scrollRef.current.current;

    // Pulse traveling border lines and hub waves
    if (!reducedMotion) {
      lineUniforms.uTime.value += delta * 0.65;
    }

    // ── 3D Antigravity Scroll Dynamics (Recede on scroll down, zoom in on scroll up) ──
    if (rootGroupRef.current) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      // In Hero: Massive Earth sits majestically in the right background (scale=1.0, z=0)
      // As user scrolls down: Earth recedes smoothly into deep space (z drops to -6.5, scale to 0.70)
      const targetZ = -Math.min(1.6, progress) * 5.2;
      const targetY = -progress * 3.8 + mousePos.current.y * 0.35;
      const targetX = isMobile ? 0 : 3.8 - Math.min(1, progress * 0.6) * 1.5 + mousePos.current.x * 0.45;
      const targetScale = Math.max(0.68, 1.0 - progress * 0.25);

      rootGroupRef.current.position.x = THREE.MathUtils.lerp(rootGroupRef.current.position.x, targetX, 0.07);
      rootGroupRef.current.position.y = THREE.MathUtils.lerp(rootGroupRef.current.position.y, targetY, 0.07);
      rootGroupRef.current.position.z = THREE.MathUtils.lerp(rootGroupRef.current.position.z, targetZ, 0.07);

      const s = THREE.MathUtils.lerp(rootGroupRef.current.scale.x, targetScale, 0.07);
      rootGroupRef.current.scale.set(s, s, s);

      // Dynamic 3D tilt
      rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.x,
        progress * 0.4 + mousePos.current.y * 0.15,
        0.06
      );
      rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.y,
        mousePos.current.x * 0.25,
        0.06
      );
    }

    // ── Continuous Planetary Spin with Scroll Velocity Boost ──
    if (spinGroupRef.current && !reducedMotion) {
      const scrollBoost = scrollRef.current.velocity * 0.9;
      spinGroupRef.current.rotation.y += delta * 0.048 + scrollBoost;
      scrollRef.current.velocity *= 0.92; // decay
    }
  });

  return (
    <group ref={rootGroupRef}>
      {/* 23.5° Earth Axial Tilt Group */}
      <group ref={tiltGroupRef} rotation={[0, 0, 23.5 * (Math.PI / 180)]}>
        {/* Continuous Spin Group */}
        <group ref={spinGroupRef}>
          {/* ── Substantial Landmass & Dot-Matrix Sphere (depthWrite: false to prevent border clipping) ── */}
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
                uniform vec3 uLandBaseColor;
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
                  
                  // Natural exponential Fresnel inner glow
                  float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
                  vec3 glow = uGlowColor * fresnel * uGlowIntensity;

                  // 3D Directional Lighting term
                  vec3 lightDir = normalize(vec3(-0.7, 0.5, 0.8));
                  float diff = max(dot(vNormal, lightDir), 0.0);

                  // Continuous Land Silhouette Coverage
                  float directMask = texture2D(uMask, vec2(u, v)).r;

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
                  
                  // Base ocean with dimensional lighting
                  vec3 oceanFinal = uOceanColor + vec3(0.01, 0.04, 0.12) * diff + glow * 0.35;
                  
                  // Substantial landmass base fill (never empty black!)
                  vec3 landTerrain = uLandBaseColor + vec3(0.02, 0.08, 0.2) * diff + glow * 0.6;
                  
                  vec3 finalColor = mix(oceanFinal, landTerrain, directMask * 0.85);
                  float finalAlpha = uOceanAlpha;
                  
                  // Luminous matrix dots & city nodes on land
                  if (centerMask.r > 0.5) {
                    float dotAlpha = smoothstep(maxDist, maxDist * 0.68, dist);
                    vec3 dotColorWithGlow = uDotColor + glow * 0.85;
                    float edge = max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
                    dotColorWithGlow += vec3(0.3) * pow(edge, 2.2);
                    finalColor = mix(finalColor, dotColorWithGlow, dotAlpha);
                    finalAlpha = max(uOceanAlpha, dotAlpha);
                  }

                  gl_FragColor = vec4(finalColor, finalAlpha);
                }
              `}
            />
          </mesh>

          {/* ── High-Precision Animated Country Borders (100% Unclipped, Luminous) ── */}
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
                  float alpha = 0.55 + pulse * 0.45; // Guaranteed bright visibility from all angles
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
                  <sphereGeometry args={[0.065, 16, 16]} />
                  <meshBasicMaterial color="#00F0FF" />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* ── Soft Natural Atmospheric Halo (No thick artificial ring) ── */}
      <mesh renderOrder={0}>
        <sphereGeometry args={[EARTH_RADIUS * 1.12, 48, 48]} />
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
              // Natural, subtle exponential atmospheric falloff
              float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
              gl_FragColor = vec4(uColor, intensity * 0.65);
            }
          `}
        />
      </mesh>

      {/* ── Layered Cinematic Lighting ── */}
      <ambientLight intensity={0.25} color="#F8FAFC" />
      <directionalLight position={[-12, 6, 10]} intensity={2.2} color="#0099FF" />
      <directionalLight position={[12, -4, -10]} intensity={1.2} color="#0033AA" />
    </group>
  );
}
