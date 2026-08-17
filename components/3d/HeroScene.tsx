'use client';

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { LightingSystem } from './LightingSystem';
import { ParticleSystem } from './ParticleSystem';
import { DataNetwork } from './DataNetwork';
import { IntelligenceCore } from './IntelligenceCore';
import { SystemNodes } from './SystemNodes';
import { CameraController } from './CameraController';
import { WebGLFallback } from './WebGLFallback';

const defaultLabels = ['NLP', 'CV', 'DATA', 'GEN', 'RL', 'ML', 'OPS', 'SEC', 'BOT', 'UI', 'UX', 'DB'];

export default function HeroScene() {
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGLSupported(!!gl);
    } catch (e) {
      setWebGLSupported(false);
    }

    // Check device capability
    const checkDevice = () => {
      const hwConcurrency = navigator.hardwareConcurrency || 4;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(hwConcurrency < 4 || isSmallScreen);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);

    // Track mouse
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Track scroll
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0;
      setScrollProgress(Math.min(Math.max(progress, 0), 1));
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!webGLSupported) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
        <WebGLFallback />
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={isMobile ? 1 : [1, 1.5]}
      >
        <LightingSystem scrollProgress={scrollProgress} />
        
        <IntelligenceCore 
          mousePosition={mousePos} 
          scrollProgress={scrollProgress} 
        />
        
        <ParticleSystem 
          count={isMobile ? 150 : 600} 
          mousePosition={mousePos} 
          scrollProgress={scrollProgress} 
        />
        
        <DataNetwork 
          visible={scrollProgress > 0.12} 
          scrollProgress={scrollProgress} 
          labels={defaultLabels} 
        />
        
        <SystemNodes 
          active={scrollProgress > 0.40} 
          scrollProgress={scrollProgress} 
        />
        
        <CameraController 
          mousePosition={mousePos} 
          scrollProgress={scrollProgress} 
        />
      </Canvas>
    </div>
  );
}
