'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as THREE from 'three';

export type SceneState = 
  | 'room' 
  | 'systems' 
  | 'products' 
  | 'work' 
  | 'technology' 
  | 'about' 
  | 'contact'
  | 'leadership'
  | 'research'
  | 'services'
  | 'industries'
  | 'philosophy'
  | 'careers'
  | 'insights';

interface GlobalContextType {
  currentScene: SceneState;
  setCurrentScene: (scene: SceneState) => void;
  cameraTarget: THREE.Vector3;
  setCameraTarget: (target: THREE.Vector3) => void;
  scrollProgress: number;
  setScrollProgress: (progress: number) => void;
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [currentScene, setCurrentScene] = useState<SceneState>('room');
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3>(new THREE.Vector3(0, 1.5, 5));
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  return (
    <GlobalContext.Provider value={{
      currentScene, setCurrentScene,
      cameraTarget, setCameraTarget,
      scrollProgress, setScrollProgress,
      isMobile, setIsMobile
    }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalStore() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalStore must be used within a GlobalProvider');
  }
  return context;
}
