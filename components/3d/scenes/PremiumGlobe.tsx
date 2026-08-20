'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import countriesData from '@/lib/data/countries.js';
import geoBordersData from '@/lib/data/geo-borders.json';

const EARTH_RADIUS = 4.4;

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
  const spinGroupRef = useRef<THREE.Group>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // 1. Instant Synchronous Precomputed Geo-Borders Buffer
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
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // 3. Dot Matrix Landmass Shader Uniforms
  const fillUniforms = useMemo(
    () => ({
      uMask: { value: maskTexture },
      uDotColor: { value: new THREE.Color('#FFFFFF') },
      uDotDensity: { value: 115.0 },
      uDotSize: { value: 0.38 },
      uGlowColor: { value: new THREE.Color('#0066FF') },
      uGlowIntensity: { value: 2.6 },
      uOceanColor: { value: new THREE.Color('#020817') },
      uOceanAlpha: { value: 0.98 },
    }),
    [maskTexture]
  );

  // 4. Animated Traveling Cyan Border Pulses Uniforms
  const lineUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#00F0FF') },
    }),
    []
  );

  useFrame((state, delta) => {
    if (spinGroupRef.current && !reducedMotion) {
      spinGroupRef.current.rotation.y += delta * 0.048;
    }
    if (!reducedMotion) {
      lineUniforms.uTime.value += delta * 0.55;
    }
  });

  return (
    <group>
      {/* 23.5° Earth Axial Tilt */}
      <group rotation={[0, 0, 23.5 * (Math.PI / 180)]}>
        {/* Continuous Spin Group */}
        <group ref={spinGroupRef}>
          {/* ── Base Dot-Matrix Landmass Sphere ── */}
          <mesh>
            <sphereGeometry args={[EARTH_RADIUS * 0.99, 64, 64]} />
            <shaderMaterial
              uniforms={fillUniforms}
              transparent
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
                  
                  vec3 finalColor = uOceanColor + glow * 0.4;
                  float finalAlpha = uOceanAlpha;
                  
                  if (centerMask.r > 0.5) {
                    float alpha = smoothstep(maxDist, maxDist * 0.72, dist);
                    vec3 dotColorWithGlow = uDotColor + glow * 0.8;
                    float edge = max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
                    dotColorWithGlow += vec3(0.2) * pow(edge, 2.5);
                    finalColor = mix(finalColor, dotColorWithGlow, alpha);
                    finalAlpha = max(uOceanAlpha, alpha);
                  }

                  gl_FragColor = vec4(finalColor, finalAlpha);
                }
              `}
            />
          </mesh>

          {/* ── High-Precision Instant Animated Country Borders ── */}
          <lineSegments>
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
                  float phase = fract(vDistance - uTime + vOffset);
                  float alpha = pow(phase, 3.8); 
                  alpha += 0.32; // Base outline brightness
                  gl_FragColor = vec4(uColor, alpha);
                }
              `}
            />
          </lineSegments>

          {/* ── Global Hub Nodes ── */}
          {HUBS.map((hub, idx) => {
            const pos = latLongToVector3(hub.lat, hub.lng, EARTH_RADIUS * 1.008);
            return (
              <group key={idx} position={pos}>
                <mesh>
                  <sphereGeometry args={[0.055, 16, 16]} />
                  <meshBasicMaterial color="#00F0FF" />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* ── Outer Atmospheric Halo ── */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.15, 48, 48]} />
        <shaderMaterial
          transparent
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
              gl_FragColor = vec4(uColor, intensity * 0.75);
            }
          `}
        />
      </mesh>

      {/* ── Lighting ── */}
      <ambientLight intensity={0.2} color="#F8FAFC" />
      <directionalLight position={[-12, 6, 10]} intensity={1.8} color="#0099FF" />
      <directionalLight position={[12, -4, -10]} intensity={1.2} color="#0033BB" />
    </group>
  );
}
