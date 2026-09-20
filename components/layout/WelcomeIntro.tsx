'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './BrandReveal.module.css';

/**
 * Premium Brand Reveal — Quantum AI Opening Identity Sequence (Revised)
 *
 * Sequence:
 * 0.0s - 0.3s : init (dark screen)
 * 0.3s - 1.2s : entrance (logo rolls/rotates in)
 * 1.2s - 1.6s : hold (logo stabilizes)
 * 1.6s - 3.2s : travel (logo travels to exactly match navbar logo position)
 * 2.3s - 2.9s : background fades out, revealing the website underneath
 * 3.2s+       : overlay unmounts seamlessly leaving the real navbar logo
 *
 * Uses `getBoundingClientRect` on `#navbar-quantum-logo` for exact positioning.
 */

const SESSION_KEY = 'quantum-ai-brand-seen';

// Custom Expo-Out for cinematic slow settling (No bounce)
const easePrecise: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Phase = 'init' | 'entrance' | 'hold' | 'travel' | 'done';

export default function WelcomeIntro({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase | null>(null); // null = SSR/first paint
  const [targetCoords, setTargetCoords] = useState<{ x: number; y: number; scale: number } | null>(null);
  
  const phaseRef = useRef<Phase | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep ref in sync for event listeners
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ── Sequence Orchestration ─────────────────────────────────
  useEffect(() => {
    // 1. Reduced motion check
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      markSeen();
      setPhase('done');
      return;
    }

    // 2. Session check (play once per session)
    try {
      if (sessionStorage.getItem(SESSION_KEY) === 'true') {
        setPhase('done');
        return;
      }
    } catch {
      // Ignored
    }

    // 3. Start Sequence
    setPhase('init');

    const t1 = setTimeout(() => setPhase('entrance'), 200);
    const t2 = setTimeout(() => setPhase('hold'), 1000); // 800ms entrance roll
    const t3 = setTimeout(() => {
      // Before travelling, calculate the exact destination
      const target = document.getElementById('navbar-quantum-logo');
      if (target) {
        const rect = target.getBoundingClientRect();
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight / 2;
        
        setTargetCoords({
          x: rect.left + rect.width / 2 - startX,
          y: rect.top + rect.height / 2 - startY,
          scale: rect.width / 110,
        });
      }
      setPhase('travel');
    }, 1350); // 350ms hold

    const t4 = setTimeout(() => {
      markSeen();
      setPhase('done');
    }, 3000); // 1650ms for travel and settle

    // Hard failsafe
    const tSafe = setTimeout(() => {
      markSeen();
      setPhase('done');
    }, 4500);

    timeoutsRef.current = [t1, t2, t3, t4, tSafe];

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // ── Skip Mechanism ─────────────────────────────────────────
  const handleSkip = useCallback(() => {
    const current = phaseRef.current;
    if (!current || current === 'done') return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    
    markSeen();
    setPhase('done');
  }, []);

  useEffect(() => {
    if (phase === 'done' || phase === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return;
      handleSkip();
    };

    window.addEventListener('click', handleSkip);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', handleSkip);
      window.removeEventListener('keydown', onKey);
    };
  }, [phase, handleSkip]);

  // ── Render ─────────────────────────────────────────────────

  if (phase === null || phase === 'done') {
    return <>{children}</>;
  }

  // Animation variants
  const logoVariants = {
    init: { scale: 0.75, rotate: -65, x: -40, y: 40, opacity: 0, filter: 'blur(4px)' },
    entrance: { 
      scale: 1, rotate: 0, x: 0, y: 0, opacity: 1, filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } 
    },
    hold: { 
      scale: 1, rotate: 0, x: 0, y: 0, opacity: 1, filter: 'blur(0px)' 
    },
    travel: (coords: typeof targetCoords) => coords ? {
      x: coords.x,
      y: coords.y,
      scale: coords.scale,
      rotate: 0, // ensure perfectly upright
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        x: { duration: 1.5, ease: [0.35, 1, 0.35, 1] }, // slightly slower start on X for curve
        y: { duration: 1.5, ease: easePrecise }, // faster start on Y
        scale: { duration: 1.5, ease: [0.25, 1, 0.3, 1] },
        default: { duration: 1.5, ease: easePrecise }
      }
    } : {
      // Failsafe fade-out if navbar logo wasn't found
      opacity: 0,
      transition: { duration: 0.4 }
    }
  };

  const trailVariants = {
    init: { opacity: 0 },
    entrance: { opacity: 0 },
    hold: { opacity: 0 },
    travel: (coords: typeof targetCoords) => coords ? {
      x: coords.x,
      y: coords.y,
      scale: coords.scale * 1.15,
      opacity: [0, 0.12, 0], // extremely restrained trace
      filter: 'blur(8px)',
      transition: { 
        x: { duration: 1.5, ease: [0.35, 1, 0.35, 1] },
        y: { duration: 1.5, ease: easePrecise },
        scale: { duration: 1.5, ease: [0.25, 1, 0.3, 1] },
        opacity: { times: [0, 0.2, 0.8], duration: 1.5 }
      }
    } : { opacity: 0 }
  };

  // Determine background opacity based on timeline (fades out 0.7s after travel starts)
  const isTravel = phase === 'travel';

  return (
    <>
      {/* Hide the real navbar logo while the animation plays for a seamless handoff */}
      <style>{`
        #navbar-quantum-logo { visibility: hidden !important; opacity: 0 !important; }
      `}</style>

      <div 
        className={styles.overlay} 
        style={{ 
          pointerEvents: isTravel ? 'none' : 'all', // Let clicks through during travel
          background: 'transparent' // Background is handled by the motion.div below
        }} 
      >
        {/* Background that reveals the website synchronized with travel */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isTravel ? 0 : 1 }}
          transition={{ duration: 1.0, delay: isTravel ? 0.25 : 0, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'var(--color-void, #030712)',
            zIndex: 1
          }}
        />

        {/* Ambient atmospheric light (fades out as travel begins) */}
        <motion.div
          className={styles.glow}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isTravel ? 0 : phase === 'init' ? 0 : 0.6,
            scale: isTravel ? 1.2 : 1.0,
          }}
          transition={{ duration: 0.8, ease: easePrecise }}
          style={{ zIndex: 2 }}
        />

        {/* The travelling logo container */}
        <motion.div
          className={styles.logoContainer}
          custom={targetCoords}
          variants={logoVariants}
          initial="init"
          animate={phase}
          style={{ zIndex: 4, transformOrigin: 'center' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/quantum-q-logo.png"
            alt=""
            className={styles.logo}
            draggable={false}
          />
        </motion.div>

        {/* Light trail / motion blur behind the travelling logo */}
        <motion.div
          className={styles.logoContainer}
          custom={targetCoords}
          variants={trailVariants}
          initial="init"
          animate={phase}
          style={{ 
            position: 'absolute',
            zIndex: 3, 
            transformOrigin: 'center',
            mixBlendMode: 'screen' 
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/quantum-q-logo.png"
            alt=""
            className={styles.logo}
            style={{ filter: 'brightness(1.5) drop-shadow(0 0 20px rgba(59, 130, 246, 0.8))' }}
            draggable={false}
          />
        </motion.div>
      </div>

      {children}
    </>
  );
}

function markSeen(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {}
}
