'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobalStore } from '@/components/layout/GlobalStore';

const INSTALLATIONS = 6;
const SCREEN_ASPECT = 15.5 / 8.5; // ~1.8235 (16:9 ratio of the screen geometry)

/**
 * Adjusts texture UV offset & repeat to simulate 'object-fit: cover'
 * preserving image aspect ratio without stretching or distortion.
 */
function adjustTextureAspect(texture: THREE.Texture, targetAspect: number = SCREEN_ASPECT) {
  if (!texture || !texture.image) return;
  const image = texture.image as HTMLImageElement;
  if (!image.width || !image.height) return;

  const imageAspect = image.width / image.height;

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  if (imageAspect > targetAspect) {
    // Image is wider than screen: crop left/right slightly
    const scale = targetAspect / imageAspect;
    texture.repeat.set(scale, 1);
    texture.offset.set((1 - scale) / 2, 0);
  } else {
    // Image is taller than screen: crop top/bottom slightly
    const scale = imageAspect / targetAspect;
    texture.repeat.set(1, scale);
    texture.offset.set(0, (1 - scale) / 2);
  }
  texture.needsUpdate = true;
}

export function DigitalGallery() {
  const groupRef = useRef<THREE.Group>(null);
  const { activeGalleryImages } = useGlobalStore();

  // Persistent reference to loaded textures for disposal and GPU memory management
  const texturesRef = useRef<Map<string, THREE.Texture>>(new Map());
  const [textureMap, setTextureMap] = useState<Map<string, THREE.Texture>>(new Map());

  // Texture loading and lifecycle management
  useEffect(() => {
    const uniqueUrls = Array.from(new Set(activeGalleryImages.filter(Boolean)));
    const currentMap = texturesRef.current;
    let isCancelled = false;

    // 1. Dispose and free GPU memory for textures that are no longer active
    for (const [url, tex] of currentMap.entries()) {
      if (!uniqueUrls.includes(url)) {
        tex.dispose();
        currentMap.delete(url);
      }
    }

    // 2. If no active images, reset to empty state (triggers fallback glow on all screens)
    if (uniqueUrls.length === 0) {
      setTextureMap(new Map());
      return;
    }

    // 3. Asynchronously load any new unique images
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    uniqueUrls.forEach((url) => {
      if (currentMap.has(url)) {
        // Already loaded and cached
        return;
      }

      loader.load(
        url,
        (tex) => {
          if (isCancelled) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          adjustTextureAspect(tex, SCREEN_ASPECT);

          currentMap.set(url, tex);
          setTextureMap(new Map(currentMap));
        },
        undefined,
        (err) => {
          console.warn(`[DigitalGallery] Could not load texture from ${url}. Screen will use fallback glow.`, err);
        }
      );
    });

    setTextureMap(new Map(currentMap));

    return () => {
      isCancelled = true;
    };
  }, [activeGalleryImages]);

  // Clean up all GPU textures when DigitalGallery unmounts
  useEffect(() => {
    return () => {
      texturesRef.current.forEach((tex) => tex.dispose());
      texturesRef.current.clear();
    };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Extremely slow rotation
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  const activeCount = activeGalleryImages.length;

  return (
    <group ref={groupRef} position={[0, -2, -5]}>
      {Array.from({ length: INSTALLATIONS }).map((_, i) => {
        const angle = (i / INSTALLATIONS) * Math.PI * 2;
        const radius = 20;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Cyclic mapping: repeat images across the 6 screens if fewer than 6
        const assignedUrl = activeCount > 0 ? activeGalleryImages[i % activeCount] : null;
        const texture = assignedUrl ? textureMap.get(assignedUrl) || null : null;
        
        return (
          <Installation 
            key={i} 
            position={[x, 0, z]} 
            rotation={[0, -angle + Math.PI / 2, 0]} 
            index={i}
            texture={texture}
          />
        );
      })}

      <ambientLight intensity={0.1} color="#ffffff" />
      <pointLight position={[0, 10, 0]} intensity={3} color="#ffffff" distance={50} decay={2} />
    </group>
  );
}

function Installation({
  position,
  rotation,
  index,
  texture,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  index: number;
  texture: THREE.Texture | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(t * 0.5 + index) * 0.5;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1 + Math.sin(t * 2 + index) * 0.5;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Massive Frame */}
      <mesh ref={meshRef}>
        <boxGeometry args={[16, 9, 1]} />
        <meshStandardMaterial color="#020304" roughness={0.1} metalness={0.9} />
        
        {texture ? (
          <>
            {/* Screen Surface with Project Image */}
            <mesh position={[0, 0, 0.51]}>
              <planeGeometry args={[15.5, 8.5]} />
              <meshStandardMaterial
                map={texture}
                roughness={0.25}
                metalness={0.1}
                toneMapped={false}
              />
            </mesh>
            {/* Subtle digital screen sheen on top of image */}
            <mesh position={[0, 0, 0.515]}>
              <planeGeometry args={[15.5, 8.5]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.06}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </>
        ) : (
          /* Fallback Glow surface (exact original appearance when no texture is available) */
          <mesh position={[0, 0, 0.51]}>
            <planeGeometry args={[15.5, 8.5]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
          </mesh>
        )}
      </mesh>

      {/* Localized stark spotlighting */}
      <pointLight ref={lightRef} position={[0, 0, 2]} intensity={1.5} color="#00e5ff" distance={15} decay={2} />
    </group>
  );
}

