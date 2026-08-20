'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import rawCountriesData from '@/lib/data/countries.js';

export interface GlobeLocation {
  lat: number;
  lng: number;
  label?: string;
  subLabel?: string;
  color?: string;
  size?: number;
}

export interface PremiumGlobeProps {
  globeRadius?: number;
  oceanColor?: string;
  oceanAlpha?: number;
  dotColor?: string;
  dotDensity?: number;
  dotSize?: number;
  lineColor?: string;
  lineThickness?: number;
  glowColor?: string;
  glowIntensity?: number;
  atmosphereColor?: string;
  autoRotateSpeed?: number;
  enableDrag?: boolean;
  scrollProgress?: number;
  locations?: GlobeLocation[];
  onSelectLocation?: (location: GlobeLocation | null) => void;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_LOCATIONS: GlobeLocation[] = [
  { lat: 40.7128, lng: -74.006, label: 'NORTH AMERICA', subLabel: 'New York · Edge Cluster 01', color: '#00F0FF', size: 0.18 },
  { lat: 37.7749, lng: -122.4194, label: 'WEST COAST', subLabel: 'San Francisco · AI Training Grid', color: '#38BDF8', size: 0.18 },
  { lat: 51.5074, lng: -0.1278, label: 'EUROPE', subLabel: 'London · Cloud Gateway', color: '#00F0FF', size: 0.18 },
  { lat: 48.8566, lng: 2.3522, label: 'CENTRAL EUROPE', subLabel: 'Paris · Neural Core', color: '#38BDF8', size: 0.16 },
  { lat: 25.2048, lng: 55.2708, label: 'MIDDLE EAST', subLabel: 'Dubai · Enterprise Hub', color: '#00F0FF', size: 0.18 },
  { lat: 31.5204, lng: 74.3587, label: 'SOUTH ASIA', subLabel: 'Lahore · Engineering HQ', color: '#55D6FF', size: 0.22 },
  { lat: 1.3521, lng: 103.8198, label: 'SOUTHEAST ASIA', subLabel: 'Singapore · Realtime Gateway', color: '#00F0FF', size: 0.18 },
  { lat: 35.6762, lng: 139.6503, label: 'EAST ASIA', subLabel: 'Tokyo · Distributed Compute', color: '#38BDF8', size: 0.18 },
  { lat: -33.8688, lng: 151.2093, label: 'OCEANIA', subLabel: 'Sydney · Edge Node', color: '#00F0FF', size: 0.16 },
];

let globalGeoCachePromise: Promise<{
  positions: number[];
  distances: number[];
  offsets: number[];
  canvas: HTMLCanvasElement | null;
}> | null = null;

function getGeoData() {
  if (globalGeoCachePromise) return globalGeoCachePromise;

  globalGeoCachePromise = new Promise((resolve) => {
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

      // 1024x512 high-performance canvas mask
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

      const RADIUS = 10;
      const LINK_RADIUS = RADIUS * 0.9902;

      const latLongToVector3 = (lat: number, lon: number, r: number) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        return new THREE.Vector3(
          -(r * Math.sin(phi) * Math.cos(theta)),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        );
      };

      const process3DRing = (ring: number[][]) => {
        if (!ring || ring.length < 2) return;
        const ringOffset = Math.random();
        let totalLen = 0;

        // Simplify redundant micro-segments
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

      resolve({ positions, distances, offsets, canvas });
    } catch (err) {
      console.error('Error generating globe GeoJSON data:', err);
      resolve({ positions: [], distances: [], offsets: [], canvas: null });
    }
  });

  return globalGeoCachePromise;
}

export default function PremiumGlobe({
  globeRadius = 1,
  oceanColor = '#050b14',
  oceanAlpha = 0.95,
  dotColor = '#E2E8F0',
  dotDensity = 115,
  dotSize = 0.38,
  lineColor = '#00F0FF',
  lineThickness = 1.5,
  glowColor = '#0055FF',
  glowIntensity = 2.2,
  atmosphereColor = 'rgba(0, 85, 255, 0.18)',
  autoRotateSpeed = 0.55,
  enableDrag = true,
  scrollProgress = 0,
  locations = DEFAULT_LOCATIONS,
  onSelectLocation,
  className,
  style,
}: PremiumGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({
    globeRadius,
    oceanColor,
    oceanAlpha,
    dotColor,
    dotDensity,
    dotSize,
    lineColor,
    lineThickness,
    glowColor,
    glowIntensity,
    atmosphereColor,
    autoRotateSpeed,
    enableDrag,
    scrollProgress,
    locations,
  });

  propsRef.current = {
    globeRadius,
    oceanColor,
    oceanAlpha,
    dotColor,
    dotDensity,
    dotSize,
    lineColor,
    lineThickness,
    glowColor,
    glowIntensity,
    atmosphereColor,
    autoRotateSpeed,
    enableDrag,
    scrollProgress,
    locations,
  };

  const [activeLocation, setActiveLocation] = useState<GlobeLocation | null>(null);

  useEffect(() => {
    let isMounted = true;
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 600;

    // Detect reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene & Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 27;

    // 2. Hierarchy Setup
    const globeGroup = new THREE.Group(); // Handles Pitch / Scroll Tilt
    scene.add(globeGroup);

    const tiltGroup = new THREE.Group(); // Earth's 23.5° axial tilt
    tiltGroup.rotation.z = 23.5 * (Math.PI / 180);
    globeGroup.add(tiltGroup);

    const spinGroup = new THREE.Group(); // Handles Continuous Yaw & Drag
    tiltGroup.add(spinGroup);

    const RADIUS = 10;
    const markersGroup = new THREE.Group();
    spinGroup.add(markersGroup);

    const localLatLongToVector3 = (lat: number, lon: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(r * Math.sin(phi) * Math.cos(theta)),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    };

    // 3. Dot Matrix Shader Material (Land dots + Ocean + Fresnel Glow)
    const fillUniforms = {
      uDotColor: { value: new THREE.Color(dotColor) },
      uDotDensity: { value: dotDensity },
      uDotSize: { value: dotSize },
      uGlowColor: { value: new THREE.Color(glowColor) },
      uGlowIntensity: { value: glowIntensity },
      uOceanColor: { value: new THREE.Color(oceanColor) },
      uOceanAlpha: { value: oceanAlpha },
      uMask: { value: null as THREE.Texture | null },
    };

    const fillMaterial = new THREE.ShaderMaterial({
      uniforms: fillUniforms,
      transparent: true,
      side: THREE.FrontSide,
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
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
          
          // Subtle edge Fresnel inner glow
          float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
          vec3 glow = uGlowColor * fresnel * uGlowIntensity;

          // Spherical grid calculation
          float dotsRows = uDotDensity;
          float vRow = floor(v * dotsRows) + 0.5;
          float vCenter = vRow / dotsRows;
          float phiCenter = vCenter * 3.14159265359;
          float sinPhiCenter = max(sin(phiCenter), 0.001);
          
          float dotsCols = max(floor(dotsRows * 2.0 * sinPhiCenter), 1.0);
          float uCol = floor(u * dotsCols) + 0.5;
          float uCenter = uCol / dotsCols;
          
          // Sample mask at center of cell
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
            // Land dot with soft antialiased edge
            float alpha = smoothstep(maxDist, maxDist * 0.75, dist);
            vec3 dotColorWithGlow = uDotColor + glow;
            
            float edge = max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
            dotColorWithGlow += vec3(0.15) * pow(edge, 3.0);
            
            finalColor = mix(finalColor, dotColorWithGlow, alpha);
            finalAlpha = max(uOceanAlpha, alpha);
          }

          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
    });

    const sphereGeo = new THREE.SphereGeometry(RADIUS * 0.99, 64, 64);
    const globeBase = new THREE.Mesh(sphereGeo, fillMaterial);
    spinGroup.add(globeBase);

    // 4. Country Borders Material & Geometry
    const lineUniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(lineColor) },
    };

    const lineMaterial = new THREE.ShaderMaterial({
      uniforms: lineUniforms,
      transparent: true,
      depthWrite: false,
      linewidth: lineThickness,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying float vDistance;
        varying float vOffset;
        attribute float aDistance;
        attribute float aOffset;
        void main() {
          vDistance = aDistance;
          vOffset = aOffset;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying float vDistance;
        varying float vOffset;
        void main() {
          float phase = fract(vDistance - uTime + vOffset);
          float alpha = pow(phase, 4.5); 
          alpha += 0.22; // Base outline visibility
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });

    const linesGeo = new THREE.BufferGeometry();
    const linesMesh = new THREE.LineSegments(linesGeo, lineMaterial);
    spinGroup.add(linesMesh);

    // 5. Atmospheric Outer Halo Mesh
    const haloGeo = new THREE.SphereGeometry(RADIUS * 1.15, 48, 48);
    const haloMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color('#0055FF') },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(uColor, intensity * 0.65);
        }
      `,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMaterial);
    globeGroup.add(haloMesh);

    // 6. Asynchronously Load Geo Data
    getGeoData()
      .then((cache) => {
        if (!isMounted) return;
        if (cache.positions.length > 0) {
          linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(cache.positions, 3));
          linesGeo.setAttribute('aDistance', new THREE.Float32BufferAttribute(cache.distances, 1));
          linesGeo.setAttribute('aOffset', new THREE.Float32BufferAttribute(cache.offsets, 1));
        }
        if (cache.canvas) {
          const maskTexture = new THREE.CanvasTexture(cache.canvas);
          maskTexture.minFilter = THREE.LinearFilter;
          maskTexture.wrapS = THREE.RepeatWrapping;
          maskTexture.wrapT = THREE.ClampToEdgeWrapping;
          maskTexture.needsUpdate = true;
          fillUniforms.uMask.value = maskTexture;
        }
      })
      .catch(console.error);

    // 7. Location Markers
    const markerMeshes: { mesh: THREE.Mesh; loc: GlobeLocation }[] = [];
    const markerGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const markerRingGeo = new THREE.RingGeometry(0.24, 0.32, 24);

    locations.forEach((loc) => {
      const pos = localLatLongToVector3(loc.lat, loc.lng, RADIUS * 1.008);
      const markerMat = new THREE.MeshBasicMaterial({ color: loc.color || '#00F0FF' });
      const mesh = new THREE.Mesh(markerGeo, markerMat);
      mesh.position.copy(pos);

      // Pulse ring facing outward
      const ringMat = new THREE.MeshBasicMaterial({
        color: loc.color || '#00F0FF',
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(markerRingGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(2));
      mesh.add(ring);

      markersGroup.add(mesh);
      markerMeshes.push({ mesh, loc });
    });

    // 8. Interaction Physics State (Inertia & Smooth Spring)
    let targetRotation = { x: 0, y: 0 };
    let currentRotation = { x: 0, y: 0 };
    let mouseParallax = { x: 0, y: 0 };
    let targetMouseParallax = { x: 0, y: 0 };
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      if (!propsRef.current.enableDrag) return;
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      try {
        container.setPointerCapture(e.pointerId);
      } catch {}
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouseParallax.x = nx * 0.25;
      targetMouseParallax.y = ny * 0.15;

      if (!isDragging || !propsRef.current.enableDrag) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotation.x += deltaX * 0.0055;
      targetRotation.y += deltaY * 0.0055;
      targetRotation.y = Math.max(-0.55, Math.min(0.55, targetRotation.y));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      try {
        if (container.hasPointerCapture(e.pointerId)) {
          container.releasePointerCapture(e.pointerId);
        }
      } catch {}
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);

    // 9. Observers for Resize & Intersection
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nw = entry.contentRect.width;
        const nh = entry.contentRect.height;
        if (nw > 0 && nh > 0 && (nw !== width || nh !== height)) {
          width = nw;
          height = nh;
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      }
    });
    resizeObserver.observe(container);

    let isIntersecting = true;
    const interObserver = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
    });
    interObserver.observe(container);

    // 10. High-Performance Render Loop
    let animationId: number;
    let time = 0;

    const renderLoop = () => {
      animationId = requestAnimationFrame(renderLoop);
      if (!isIntersecting) return;

      const activeProps = propsRef.current;
      time += 0.016;

      // Scroll response
      const scrollOffset = activeProps.scrollProgress || 0;
      const scrollPitch = Math.sin(scrollOffset * Math.PI) * 0.2;
      const scrollScale = 1 + Math.sin(scrollOffset * Math.PI) * 0.12;

      globeGroup.scale.setScalar((activeProps.globeRadius || 1) * scrollScale);

      // Auto rotation & mouse inertia
      if (!prefersReducedMotion && !isDragging) {
        targetRotation.x += 0.0022 * (activeProps.autoRotateSpeed || 0.5);
      }

      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.08;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.08;

      mouseParallax.x += (targetMouseParallax.x - mouseParallax.x) * 0.05;
      mouseParallax.y += (targetMouseParallax.y - mouseParallax.y) * 0.05;

      spinGroup.rotation.y = currentRotation.x;
      globeGroup.rotation.x = Math.max(-0.55, Math.min(0.55, currentRotation.y + scrollPitch + mouseParallax.y));
      globeGroup.rotation.y = mouseParallax.x;

      // Pulse traveling outlines
      if (!prefersReducedMotion) {
        lineUniforms.uTime.value += 0.006;
      }

      // Marker ring pulsation
      markerMeshes.forEach((item, idx) => {
        const ring = item.mesh.children[0] as THREE.Mesh;
        if (ring) {
          const s = 1 + Math.sin(time * 3 + idx) * 0.3;
          ring.scale.set(s, s, s);
          (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0.2, 0.7 - (s - 1));
        }
      });

      renderer.render(scene, camera);
    };

    renderLoop();

    // 11. Cleanup
    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      interObserver.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);

      markerMeshes.forEach((item) => {
        item.mesh.geometry.dispose();
        (item.mesh.material as THREE.Material).dispose();
      });

      linesGeo.dispose();
      sphereGeo.dispose();
      haloGeo.dispose();
      lineMaterial.dispose();
      fillMaterial.dispose();
      haloMaterial.dispose();
      if (fillUniforms.uMask.value) fillUniforms.uMask.value.dispose();

      renderer.forceContextLoss();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [globeRadius, oceanColor, oceanAlpha, dotColor, dotDensity, dotSize, lineColor, lineThickness, glowColor, glowIntensity, autoRotateSpeed]);

  return (
    <div
      ref={mountRef}
      className={className}
      data-trail="link"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: enableDrag ? 'grab' : 'default',
        touchAction: 'none',
        background: atmosphereColor
          ? `radial-gradient(circle at 50% 50%, ${atmosphereColor} 0%, transparent 65%)`
          : 'none',
        ...style,
      }}
    />
  );
}
