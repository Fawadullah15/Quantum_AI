'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuantumLogo } from '../ui/QuantumLogo';

const SESSION_KEY = 'qai_intro_seen';

/**
 * WelcomeIntro — plays once per browser session.
 * Wrap the public layout root with this.
 * sessionStorage is read client-side only to prevent hydration mismatches.
 */
export default function WelcomeIntro({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<'intro' | 'done'>('intro');
  const [mounted, setMounted] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check sessionStorage
    let hasSeen = false;
    try {
      hasSeen = !!sessionStorage.getItem(SESSION_KEY);
      if (!hasSeen) sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // sessionStorage unavailable — skip intro
      hasSeen = true;
    }

    if (hasSeen || prefersReduced) {
      setSkipIntro(true);
      setPhase('done');
      return;
    }

    // Auto-complete intro sequence at 2.3s
    const t = setTimeout(() => setPhase('done'), 2300);
    return () => clearTimeout(t);
  }, []);

  // Before mount, render nothing special (avoids hydration mismatch)
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {phase === 'intro' && !skipIntro && (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#020817',
              pointerEvents: 'all',
            }}
          >
            {/* Atmospheric glow */}
            <div style={{
              position: 'absolute',
              width: 600,
              height: 600,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(22,119,255,0.10) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }} />

            {/* Q Logo — 0.3s to 0.7s */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'relative', zIndex: 2 }}
            >
              <QuantumLogo
                width={100}
                height={100}
                style={{ filter: 'drop-shadow(0 0 28px rgba(56,189,248,0.7))' }}
              />
            </motion.div>

            {/* WELCOME — appears 0.8s, fades 1.1s */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
              transition={{
                times: [0, 0.18, 0.65, 1],
                delay: 0.8,
                duration: 0.55,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                marginTop: '7rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: '#64748B',
                zIndex: 2,
              }}
            >
              WELCOME
            </motion.div>

            {/* QUANTUM AI — appears 1.25s */}
            <motion.div
              initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 1.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                marginTop: '7rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                zIndex: 2,
              }}
            >
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: '1.1rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#F8FAFF',
              }}>
                QUANTUM
              </span>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 900,
                fontSize: '1.1rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                background: 'linear-gradient(to right, #20A8FF, #55D6FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                AI
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children always rendered beneath, fade in when intro is done */}
      <motion.div
        animate={{ opacity: phase === 'done' || skipIntro ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ willChange: 'opacity' }}
      >
        {children}
      </motion.div>
    </>
  );
}
