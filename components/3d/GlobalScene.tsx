'use client';

import React, { useRef, Suspense, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobalStore } from '@/components/layout/GlobalStore';
import { GlobalParticles } from './particles/GlobalParticles';
import { PremiumGlobe } from './scenes/PremiumGlobe';

// Lazy load the other heavy scenes
const EarthNode = React.lazy(() => import('./scenes/EarthNode').then(m => ({ default: m.EarthNode })));
const NeuralNetwork = React.lazy(() => import('./scenes/NeuralNetwork').then(m => ({ default: m.NeuralNetwork })));
const SoftwareSpace = React.lazy(() => import('./scenes/SoftwareSpace').then(m => ({ default: m.SoftwareSpace })));
const DigitalGallery = React.lazy(() => import('./scenes/DigitalGallery').then(m => ({ default: m.DigitalGallery })));
const AILaboratory = React.lazy(() => import('./scenes/AILaboratory').then(m => ({ default: m.AILaboratory })));
const ArchitecturalSpace = React.lazy(() => import('./scenes/ArchitecturalSpace').then(m => ({ default: m.ArchitecturalSpace })));
const ModularSystem = React.lazy(() => import('./scenes/ModularSystem').then(m => ({ default: m.ModularSystem })));
const GlobalMap = React.lazy(() => import('./scenes/GlobalMap').then(m => ({ default: m.GlobalMap })));
const PhilosophyCore = React.lazy(() => import('./scenes/PhilosophyCore').then(m => ({ default: m.PhilosophyCore })));
const OrbitalSystem = React.lazy(() => import('./scenes/OrbitalSystem').then(m => ({ default: m.OrbitalSystem })));
const SignalNetwork = React.lazy(() => import('./scenes/SignalNetwork').then(m => ({ default: m.SignalNetwork })));
const LeadershipCore = React.lazy(() => import('./scenes/LeadershipCore').then(m => ({ default: m.LeadershipCore })));

// Camera configuration for Home path
const HOME_START_Z = 14.5;
const HOME_END_Z = 22;

export function GlobalScene() {
  const { scrollProgress, currentScene } = useGlobalStore();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    
    // Parallax
    const targetX = mouseRef.current.x * 1.5; // subtle parallax
    const targetY = mouseRef.current.y * 1.0;

    if ((currentScene as string) === 'room' || (currentScene as string) === 'earth') {
      // Home scroll logic: move camera back and slightly down as user scrolls,
      // which pushes the Earth up and makes it smaller to make room for content.
      const targetZ = HOME_START_Z + (HOME_END_Z - HOME_START_Z) * scrollProgress;
      const camYOffset = -scrollProgress * 8; // Move camera down by up to 8 units
      
      // Offset camera slightly left so Earth appears on the right
      const isMobile = window.innerWidth < 768;
      const camXOffset = isMobile ? 0 : -3.8; 
      
      cam.position.x = THREE.MathUtils.lerp(cam.position.x, targetX + camXOffset, 0.05);
      cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY + camYOffset, 0.05);
      cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, 0.08);
      
      // Look slightly to the right of the camera's X position to keep Earth centered in the right half
      cam.lookAt((cam.position.x - camXOffset) * 0.2, cam.position.y * 0.2, 0);
    } else {
      // Other scenes: fixed camera looking at origin with slight parallax
      const targetZ = 15;
      cam.position.x = THREE.MathUtils.lerp(cam.position.x, targetX, 0.05);
      cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY, 0.05);
      cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, 0.05);
      cam.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <fog attach="fog" args={['#020817', 8, 80]} />
      <ambientLight intensity={0.05} color="#F8FAFF" />

      <Suspense fallback={null}>
        {/* Home globe */}
        {((currentScene as string) === 'room' || (currentScene as string) === 'earth') && <PremiumGlobe />}

        <GlobalParticles />

        {/* Dynamic Scenes */}
        {currentScene === 'technology' && <EarthNode />}
        {currentScene === 'systems' && <NeuralNetwork />}
        {currentScene === 'products' && <SoftwareSpace />}
        {currentScene === 'work' && <DigitalGallery />}
        {currentScene === 'research' && <AILaboratory />}
        {currentScene === 'about' && <ArchitecturalSpace />}
        {currentScene === 'services' && <ModularSystem />}
        {currentScene === 'industries' && <GlobalMap />}
        {currentScene === 'philosophy' && <PhilosophyCore />}
        {currentScene === 'careers' && <OrbitalSystem />}
        {currentScene === 'contact' && <SignalNetwork />}
        {currentScene === 'leadership' && <LeadershipCore />}
        
      </Suspense>

    </>
  );
}
