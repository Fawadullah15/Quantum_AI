'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { GlobalScene } from './GlobalScene';
import { WebGLFallback } from './WebGLFallback';

export function GlobalSceneWrapper() {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const isAvailable = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setHasWebGL(isAvailable);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (hasWebGL === false) {
    return <WebGLFallback />;
  }

  if (hasWebGL === null) {
    return <div style={{ position: 'absolute', inset: 0, backgroundColor: '#020817' }} />;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50, near: 0.1, far: 500 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: 3, /* ACESFilmicToneMapping */
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 1.5]}
        shadows={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Deep midnight blue background */}
        <color attach="background" args={['#020817']} />

        <Suspense fallback={null}>
          <GlobalScene />
        </Suspense>

        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
