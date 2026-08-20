'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import rawCountriesData from '@/lib/data/countries.js';

const EARTH_RADIUS = 4.4;

// ── Geographic Conversion Helper ─────────────────────────────────────────────
const latLongToVector3 = (lat: number, lon: number, r: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
};

// ── Cached GeoJSON Data ──────────────────────────────────────────────────────
let globalGeoDataPromise: Promise<{
  positions: Float32Array;
  distances: Float32Array;
  offsets: Float32Array;
  maskTexture: THREE.CanvasTexture | null;
}> | null = null;

function loadGeoData() {
  if (globalGeoDataPromise) return globalGeoDataPromise;

  globalGeoDataPromise = new Promise((resolve) => {
    try {
      let geoData: any = rawCountriesData;
      if (geoData && typeof geoData === 'object' && 'default' in geoData) {
        geoData = (geoData as any).default;
      }
      if (typeof geoData === 'string') {
        try {
          geoData = JSON.parse(geoData);
        } catch {
          geoData = { type: 'FeatureCollection', features: [] };
        }
      }
      if (!geoData || !geoData.features || !Array.isArray(geoData.features)) {
        geoData = { type: 'FeatureCollection', features: [] };
      }

      const positions: number[] = [];
      const distances: number[] = [];
      const offsets: number[] = [];

      // 1024x512 Canvas texture mask
      const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      let ctx: CanvasRenderingContext2D | null = null;
      if (canvas) {
        canvas.width = 1024;
        canvas.height = 512;
        ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#FFFFFF';
        }
      }

      const LINK_RADIUS = EARTH_RADIUS * 0.992;

      const process3DRing = (ring: number[][]) => {
        if (!ring || ring.length < 2) return;
        const ringOffset = Math.random();
        let totalLen = 0;

        // Filter redundant micro-segments
        const simplifiedRing = [ring[0]];
        for (let i = 1; i < ring.length; i++) {
          const prev = simplifiedRing[simplifiedRing.length - 1];
          const curr = ring[i];
          const dist = Math.abs(curr[0] - prev[0]) + Math.abs(curr[1] - prev[1]);
          if (dist > 0.1 || i === ring.length - 1) {
            simplifiedRing.push(curr);
          }
        }

        for (let i = 0; i < simplifiedRing.length - 1; i++) {
          const p1 = latLongToVector3(simplifiedRing[i][1], simplifiedRing[i][0], LINK_RADIUS);
          const p2 = latLongToVector3(simplifiedRing[i + 1][1], simplifiedRing[i + 1][0], LINK_RADIUS);
          totalLen += p1.distanceTo(p2);
        }

        let currentDist = 0;
        for (let i = 0; i < simplifiedRing.length - 1; i++) {
          const p1 = latLongToVector3(simplifiedRing[i][1], simplifiedRing[i][0], LINK_RADIUS);
          const p2 = latLongToVector3(simplifiedRing[i + 1][1], simplifiedRing[i + 1][0], LINK_RADIUS);
          const segLen = p1.distanceTo(p2);

          positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
          distances.push(currentDist / Math.max(totalLen, 0.001), (currentDist + segLen) / Math.max(totalLen, 0.001));
          offsets.push(ringOffset, ringOffset);
          currentDist += segLen;
        }
      };

      const addPolygonToCtxPath = (polygon: number[][][]) => {
        if (!ctx || !canvas) return;
        polygon.forEach((ring) => {
          ring.forEach((coord, i) => {
            const x = ((coord[0] + 180) / 360) * canvas.width;
            const y = ((90 - coord[1]) / 180) * canvas.height;
            if (i === 0) ctx!.moveTo(x, y);
            else ctx!.lineTo(x, y);
          });
          ctx!.closePath();
        });
      };

      const features = geoData.features || [];
      features.forEach((feature: any) => {
        if (!feature || !feature.geometry) return;
        const type = feature.geometry.type;
        if (type === 'Polygon') {
          const coords = feature.geometry.coordinates;
          coords.forEach(process3DRing);
          if (ctx) {
            ctx.beginPath();
            addPolygonToCtxPath(coords);
            ctx.fill('evenodd');
          }
        } else if (type === 'MultiPolygon') {
          const coords = feature.geometry.coordinates;
          coords.forEach((poly: any) => {
            poly.forEach(process3DRing);
            if (ctx) {
              ctx.beginPath();
              addPolygonToCtxPath(poly);
              ctx.fill('evenodd');
            }
          });
        }
      });

      let maskTexture: THREE.CanvasTexture | null = null;
      if (canvas) {
        maskTexture = new THREE.CanvasTexture(canvas);
        maskTexture.minFilter = THREE.LinearFilter;
        maskTexture.wrapS = THREE.RepeatWrapping;
        maskTexture.wrapT = THREE.ClampToEdgeWrapping;
        maskTexture.needsUpdate = true;
      }

      resolve({
        positions: new Float32Array(positions),
        distances: new Float32Array(distances),
        offsets: new Float32Array(offsets),
        maskTexture,
      });
    } catch (err) {
      console.error('Error generating 3D globe geo data:', err);
      resolve({
        positions: new Float32Array(),
        distances: new Float32Array(),
        offsets: new Float32Array(),
        maskTexture: null,
      });
    }
  });

  return globalGeoDataPromise;
}

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

export function PremiumGlobe() {
  const spinGroupRef = useRef<THREE.Group>(null);
  const [geoData, setGeoData] = useState<{
    positions: Float32Array;
    distances: Float32Array;
    offsets: Float32Array;
    maskTexture: THREE.CanvasTexture | null;
  } | null>(null);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    loadGeoData().then(setGeoData);

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // 1. Dot Matrix Landmass Shader
  const fillUniforms = useMemo(
    () => ({
      uMask: { value: null as THREE.Texture | null },
      uDotColor: { value: new THREE.Color('#E2E8F0') },
      uDotDensity: { value: 110.0 },
      uDotSize: { value: 0.36 },
      uGlowColor: { value: new THREE.Color('#0055FF') },
      uGlowIntensity: { value: 2.4 },
      uOceanColor: { value: new THREE.Color('#030712') },
      uOceanAlpha: { value: 0.98 },
    }),
    []
  );

  useEffect(() => {
    if (geoData?.maskTexture) {
      fillUniforms.uMask.value = geoData.maskTexture;
    }
  }, [geoData, fillUniforms]);

  // 2. Animated Border Lines Material
  const lineUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#00F0FF') },
    }),
    []
  );

  useFrame((state, delta) => {
    if (spinGroupRef.current && !reducedMotion) {
      spinGroupRef.current.rotation.y += delta * 0.042;
    }
    if (!reducedMotion) {
      lineUniforms.uTime.value += delta * 0.45;
    }
  });

  return (
    <group>
      {/* 23.5° Axial Tilt Group */}
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
                  float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
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
                  
                  vec3 finalColor = uOceanColor + glow * 0.35;
                  float finalAlpha = uOceanAlpha;
                  
                  if (centerMask.r > 0.5) {
                    float alpha = smoothstep(maxDist, maxDist * 0.75, dist);
                    vec3 dotColorWithGlow = uDotColor + glow;
                    float edge = max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
                    dotColorWithGlow += vec3(0.15) * pow(edge, 3.0);
                    finalColor = mix(finalColor, dotColorWithGlow, alpha);
                    finalAlpha = max(uOceanAlpha, alpha);
                  }

                  gl_FragColor = vec4(finalColor, finalAlpha);
                }
              `}
            />
          </mesh>

          {/* ── High-Precision Animated Country Borders ── */}
          {geoData && geoData.positions.length > 0 && (
            <lineSegments>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[geoData.positions, 3]}
                />
                <bufferAttribute
                  attach="attributes-aDistance"
                  args={[geoData.distances, 1]}
                />
                <bufferAttribute
                  attach="attributes-aOffset"
                  args={[geoData.offsets, 1]}
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
                    float alpha = pow(phase, 4.5); 
                    alpha += 0.22;
                    gl_FragColor = vec4(uColor, alpha);
                  }
                `}
              />
            </lineSegments>
          )}

          {/* ── Global Hub Nodes ── */}
          {HUBS.map((hub, idx) => {
            const pos = latLongToVector3(hub.lat, hub.lng, EARTH_RADIUS * 1.008);
            return (
              <group key={idx} position={pos}>
                <mesh>
                  <sphereGeometry args={[0.045, 12, 12]} />
                  <meshBasicMaterial color="#00F0FF" />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* ── Outer Atmospheric Halo ── */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.14, 48, 48]} />
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
              float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
              gl_FragColor = vec4(uColor, intensity * 0.65);
            }
          `}
        />
      </mesh>

      {/* ── Dynamic Ambient Lighting ── */}
      <ambientLight intensity={0.15} color="#F8FAFC" />
      <directionalLight position={[-12, 6, 10]} intensity={1.5} color="#0088FF" />
      <directionalLight position={[12, -4, -10]} intensity={1.0} color="#0033AA" />
    </group>
  );
}
