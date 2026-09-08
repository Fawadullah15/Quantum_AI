'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobalStore } from '@/components/layout/GlobalStore';

const INSTALLATIONS = 6;
const SCREEN_W = 15.5;
const SCREEN_H = 8.5;
const SCREEN_ASPECT = SCREEN_W / SCREEN_H;

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
  texture.needsUpdate = true;
}

export function DigitalGallery() {
  const groupRef = useRef<THREE.Group>(null);
  const { activeGalleryImages } = useGlobalStore();

  useFrame((_, delta) => {
    if (groupRef.current) {
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
        const imageUrl = activeCount > 0 ? activeGalleryImages[i % activeCount] : null;
        return (
          <Installation
            key={i}
            position={[x, 0, z]}
            rotation={[0, -angle + Math.PI / 2, 0]}
            index={i}
            imageUrl={imageUrl}
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
  imageUrl,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
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
    loader.setCrossOrigin('anonymous');

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
          console.warn('[DigitalGallery] Screen ' + index + ': failed to load ' + imageUrl, err);
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
      bobRef.current.position.y = Math.sin(t * 0.5 + index) * 0.5;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1 + Math.sin(t * 2 + index) * 0.5;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <group ref={bobRef}>
        <mesh>
          <boxGeometry args={[16, 9, 1]} />
          <meshStandardMaterial color="#020304" roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.51]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          {texture ? (
            <meshBasicMaterial map={texture} toneMapped={false} />
          ) : (
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.1}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          )}
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
