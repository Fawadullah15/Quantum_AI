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

export function GlobalScene() {
  const { currentScene } = useGlobalStore();
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollTargetRef = useRef(0);
  const scrollCurrentRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY || 0;
      const heroHeight = window.innerHeight || 800;
      scrollTargetRef.current = Math.min(2.5, scrollY / heroHeight);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    
    // Parallax
    const targetX = mouseRef.current.x * 1.5;
    const targetY = mouseRef.current.y * 1.0;

    // Smooth scroll interpolation
    scrollCurrentRef.current = THREE.MathUtils.lerp(scrollCurrentRef.current, scrollTargetRef.current, 0.07);
    const p = scrollCurrentRef.current;

    if ((currentScene as string) === 'room' || (currentScene as string) === 'earth') {
      // ── Far & Near Dynamic 3D Scroll Effect ──
      // Top of page: Camera is near (z=12.0), Earth is close and large.
      // Scrolling down: Camera pulls far away (z=25.0), Earth moves far into the distance.
      // Scrolling up: Camera zooms back in near (z=12.0), bringing Earth close!
      const targetZ = 12.0 + p * 6.5;
      const camYOffset = -p * 5.5;
      
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const camXOffset = isMobile ? 0 : -3.8 + p * 1.2;
      
      cam.position.x = THREE.MathUtils.lerp(cam.position.x, targetX + camXOffset, 0.06);
      cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY + camYOffset, 0.06);
      cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, 0.08);
      
      cam.lookAt((cam.position.x - camXOffset) * 0.2, cam.position.y * 0.2, 0);
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
      <ambientLight intensity={0.05} color="#F8FAFF" />

      <Suspense fallback={null}>
        {/* Home 3D Earth */}
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
