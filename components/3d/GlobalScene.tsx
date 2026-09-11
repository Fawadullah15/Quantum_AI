'use client';

import React, { useRef, Suspense, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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

/**
 * MobileFog — Adapts fog near/far based on viewport width.
 * Desktop: deep fog (8–80) for expansive depth.
 * Mobile: compressed fog (5–40) so objects stay visible and the scene
 * doesn't feel like tiny dots lost in infinite space.
 */
function MobileFog() {
  const { size } = useThree();
  const width = size.width || (typeof window !== 'undefined' ? window.innerWidth : 1200);
  const isMobile = width < 768;
  
  return (
    <fog
      attach="fog"
      args={['#020817', isMobile ? 5 : 8, isMobile ? 40 : 80]}
    />
  );
}

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
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isLandscapeMobile = isMobile && window.innerWidth > window.innerHeight;
    
    // Parallax — greatly reduced on mobile to avoid the globe drifting off-screen
    const parallaxScale = isMobile ? 0.15 : 1.0;
    const targetX = mouseRef.current.x * 1.2 * parallaxScale;
    const targetY = mouseRef.current.y * 0.8 * parallaxScale;

    if ((currentScene as string) === 'room' || (currentScene as string) === 'earth') {
      if (isMobile) {
        // ── MOBILE COMPOSITION ──
        // Camera positioned much closer for a large, cinematic globe hero shot.
        // Centered horizontally with a slight upward offset so the globe
        // occupies the upper ~60% of the viewport, leaving clear space for hero text below.
        const mobileZ = isLandscapeMobile ? 10.5 : 9.5;
        const mobileY = isLandscapeMobile ? 0.8 : 1.2;
        const mobileFov = isLandscapeMobile ? 48 : 55;
        
        cam.position.x = THREE.MathUtils.lerp(cam.position.x, targetX, 0.05);
        cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY + mobileY, 0.05);
        cam.position.z = THREE.MathUtils.lerp(cam.position.z, mobileZ, 0.05);
        
        // Smooth FOV transition
        cam.fov = THREE.MathUtils.lerp(cam.fov, mobileFov, 0.05);
        cam.updateProjectionMatrix();
        
        cam.lookAt(0, 0, 0);
      } else {
        // ── DESKTOP COMPOSITION — unchanged ──
        const camXOffset = -3.8;
        
        cam.position.x = THREE.MathUtils.lerp(cam.position.x, targetX + camXOffset, 0.05);
        cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY, 0.05);
        cam.position.z = THREE.MathUtils.lerp(cam.position.z, 14.5, 0.05);
        
        // Restore desktop FOV if switching from mobile
        cam.fov = THREE.MathUtils.lerp(cam.fov, 50, 0.05);
        cam.updateProjectionMatrix();
        
        cam.lookAt(0, 0, 0);
      }
    } else {
      const targetZ = isMobile ? 12 : 15;
      cam.position.x = THREE.MathUtils.lerp(cam.position.x, targetX, 0.05);
      cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY, 0.05);
      cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, 0.05);
      
      // Restore appropriate FOV for non-home scenes
      const sceneFov = isMobile ? 52 : 50;
      cam.fov = THREE.MathUtils.lerp(cam.fov, sceneFov, 0.05);
      cam.updateProjectionMatrix();
      
      cam.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <MobileFog />
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
