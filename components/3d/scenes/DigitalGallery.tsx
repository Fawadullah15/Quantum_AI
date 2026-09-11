'use client';

import React, { useRef, useState, useEffect, useSyncExternalStore } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { galleryStore } from '@/lib/gallery-state';

const INSTALLATIONS = 6;
const SCREEN_W = 15.5;
const SCREEN_H = 8.5;
const SCREEN_ASPECT = SCREEN_W / SCREEN_H;

/**
 * Responsive composition settings for 3D Screen Gallery:
 * - Desktop (>= 1024px): 100% preserves current scale (1.0), radius (20), position ([0, -2, -5]), and speed (0.025).
 * - Tablet (768px - 1023px): intermediate balanced depth and gentle rotation.
 * - Mobile (< 768px): significantly scaled down (0.22), deeper in background ([0, 0.4, -15]),
 *   compact radius (8.5), and ~28% slower rotation (0.018), ensuring closest screen never
 *   exceeds 30-40% of viewport width and never covers page content.
 */
function useGalleryConfig() {
  const size = useThree((state) => state.size);
  const width = size.width || (typeof window !== 'undefined' ? window.innerWidth : 1200);
  const height = size.height || (typeof window !== 'undefined' ? window.innerHeight : 800);
  const isLandscape = width > height && height < 600;

  if (width < 768) {
    if (isLandscape) {
      return {
        scale: 0.40,
        radius: 7.5,
        groupPosition: [0, -0.6, -5] as [number, number, number],
        rotationSpeed: 0.020,
      };
    }
    return {
      scale: 0.46,
      radius: 8.0,
      groupPosition: [0, -1.2, -4] as [number, number, number],
      rotationSpeed: 0.020,
    };
  } else if (width < 1024) {
    return {
      scale: 0.65,
      radius: 13.0,
      groupPosition: [0, -1.5, -6] as [number, number, number],
      rotationSpeed: 0.022,
    };
  } else {
    return {
      scale: 1.0,
      radius: 20,
      groupPosition: [0, -2, -5] as [number, number, number],
      rotationSpeed: 0.025,
    };
  }
}

function adjustTextureAspect(texture: THREE.Texture) {
  if (!texture.image) return;
  const img = texture.image as HTMLImageElement;
  if (!img.width || !img.height) return;
  const imageAspect = img.width / img.height;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  if (imageAspect > SCREEN_ASPECT) {
    const scale = SCREEN_ASPECT / imageAspect;
    texture.repeat.set(scale, 1);
    texture.offset.set((1 - scale) / 2, 0);
  } else {
    const scale = imageAspect / SCREEN_ASPECT;
    texture.repeat.set(1, scale);
    texture.offset.set(0, (1 - scale) / 2);
  }
  texture.matrixAutoUpdate = true;
  texture.needsUpdate = true;
}

export function DigitalGallery() {
  const groupRef = useRef<THREE.Group>(null);
  const config = useGalleryConfig();

  /**
   * Read gallery images from the MODULE-LEVEL store, not React context.
   * useSyncExternalStore works across all render tree boundaries,
   * including the R3F Canvas internal reconciler.
   */
  const activeGalleryImages = useSyncExternalStore(
    galleryStore.subscribe,
    galleryStore.getSnapshot,
    // Server snapshot (always empty — no images on server)
    () => [] as string[]
  );

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * config.rotationSpeed;
    }
  });

  const validImages = activeGalleryImages.filter(
    (img): img is string => typeof img === 'string' && img.trim().length > 0
  );
  const activeCount = validImages.length;

  return (
    <group ref={groupRef} position={config.groupPosition}>
      {Array.from({ length: INSTALLATIONS }).map((_, i) => {
        const angle = (i / INSTALLATIONS) * Math.PI * 2;
        const x = Math.cos(angle) * config.radius;
        const z = Math.sin(angle) * config.radius;
        // Inward facing: screen forward normal (+Z) points directly toward center [0, 0, 0]
        const rotY = Math.atan2(-x, -z);
        const imageUrl = activeCount > 0 ? validImages[i % activeCount] : null;
        return (
          <Installation
            key={i}
            position={[x, 0, z]}
            rotation={[0, rotY, 0]}
            scale={config.scale}
            index={i}
            imageUrl={imageUrl}
          />
        );
      })}
      <ambientLight intensity={0.2} color="#ffffff" />
      <pointLight position={[0, 10, 0]} intensity={3} color="#ffffff" distance={50} decay={2} />
    </group>
  );
}

function Installation({
  position,
  rotation,
  scale,
  index,
  imageUrl,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  index: number;
  imageUrl: string | null;
}) {
  const bobRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setTexture(null);
      return;
    }

    let cancelled = false;
    let loadedTex: THREE.Texture | null = null;

    const loader = new THREE.TextureLoader();
    if (!imageUrl.startsWith('data:')) {
      loader.setCrossOrigin('anonymous');
    }

    loader.load(
      imageUrl,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        adjustTextureAspect(tex);
        loadedTex = tex;
        setTexture(tex);
      },
      undefined,
      (err) => {
        if (!cancelled) {
          console.warn('[DigitalGallery] Screen ' + index + ': failed to load ' + imageUrl.slice(0, 50), err);
        }
      }
    );

    return () => {
      cancelled = true;
      setTexture(null);
      if (loadedTex) {
        loadedTex.dispose();
        loadedTex = null;
      }
    };
  }, [imageUrl, index]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (bobRef.current) {
      bobRef.current.position.y = Math.sin(t * 0.5 + index) * (0.5 * scale);
    }
    if (lightRef.current) {
      lightRef.current.intensity = (1 + Math.sin(t * 2 + index) * 0.5) * Math.min(scale * 1.5, 1);
    }
  });

  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <group ref={bobRef}>
        {/* TV Frame Housing: 16x9x1 enclosure */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[16, 9, 1]} />
          <meshStandardMaterial color="#020304" roughness={0.1} metalness={0.9} />
        </mesh>

        {/* Front Screen Display Surface:
            - Positioned at z = 0.55 (0.05 units in front of box face at z = 0.50) to eliminate Z-fighting
            - key={texture?.uuid} forces fresh MeshBasicMaterial instance when texture loads
            - side={THREE.DoubleSide} prevents any backface culling
            - toneMapped={false} keeps true photographic contrast and vibrance
            - polygonOffset ensures plane always draws cleanly on top of housing */}
        <mesh position={[0, 0, 0.55]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial
            key={texture ? texture.uuid : 'empty-screen'}
            map={texture || undefined}
            color={texture ? '#ffffff' : '#040d21'}
            side={THREE.DoubleSide}
            toneMapped={false}
            transparent={false}
            opacity={1}
            depthTest={true}
            depthWrite={true}
            polygonOffset={true}
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>

        {/* Reverse-Side Screen Display Surface:
            - Positioned at z = -0.55 (0.05 units behind back box face at z = -0.50)
            - rotation={[0, Math.PI, 0]} orients the display outward from the reverse face
            - Uses identical project texture with aspect ratio preserved
            - Guarantees the project content is ALWAYS visible when a screen approaches
              the camera in the front half of the orbit, completely eliminating blank black backsides */}
        <mesh position={[0, 0, -0.55]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial
            key={texture ? `${texture.uuid}-back` : 'empty-screen-back'}
            map={texture || undefined}
            color={texture ? '#ffffff' : '#040d21'}
            side={THREE.DoubleSide}
            toneMapped={false}
            transparent={false}
            opacity={1}
            depthTest={true}
            depthWrite={true}
            polygonOffset={true}
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>

        <pointLight
          ref={lightRef}
          position={[0, 0, 2]}
          intensity={1.5}
          color="#00e5ff"
          distance={15}
          decay={2}
        />
      </group>
    </group>
  );
}
