'use client';

import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMemo } from 'react';

interface CameraControllerProps {
  mousePosition: { x: number; y: number };
  scrollProgress: number;
}

export function CameraController({ mousePosition, scrollProgress }: CameraControllerProps) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const idealCameraPos = useMemo(() => new THREE.Vector3(0, 0, 8), []);

  useFrame(() => {
    // Determine base Z based on scroll
    let targetZ = 8;
    if (scrollProgress < 0.5) {
      targetZ = 8 + (scrollProgress * 2) * 4; // 8 to 12
    } else {
      targetZ = 12 - ((scrollProgress - 0.5) * 2) * 2; // 12 to 10
    }

    // Add mouse parallax
    const offsetX = mousePosition.x * 1.5;
    const offsetY = mousePosition.y * 1.5;

    idealCameraPos.set(offsetX, offsetY, targetZ);

    // Smooth lerp camera position
    camera.position.lerp(idealCameraPos, 0.05);

    // Target bob based on scroll slightly
    target.y = THREE.MathUtils.lerp(target.y, scrollProgress * 1.5, 0.05);
    camera.lookAt(target);
  });

  return null;
}
