'use client';

import React, { useRef, Suspense, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobalStore } from '@/components/layout/GlobalStore';
import { GlobalParticles } from './particles/GlobalParticles';

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

export function GlobalScene() {
  const { currentScene } = useGlobalStore();
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
    
    // Smooth camera parallax
    const targetX = mouseRef.current.x * 1.2;
    const targetY = mouseRef.current.y * 0.8;

    if ((currentScene as string) === 'room' || (currentScene as string) === 'earth') {
      const targetZ = 14.5;
      cam.position.x = THREE.MathUtils.lerp(cam.position.x, targetX, 0.05);
      cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY, 0.05);
      cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, 0.05);
      cam.lookAt(0, 0, 0);
    } else {
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
      <ambientLight intensity={0.15} color="#F8FAFF" />

      <Suspense fallback={null}>
        <GlobalParticles />

        {/* Dynamic Sub-Page Scenes */}
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
