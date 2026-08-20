'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuantumLogo } from '../ui/QuantumLogo';

export default function WelcomeIntro({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<'intro' | 'done'>('intro');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setPhase('done');
      return;
    }

    // Auto-complete intro sequence after 2.2s
    const t = setTimeout(() => {
      setPhase('done');
    }, 2200);

    return () => clearTimeout(t);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="welcome-intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#020817',
              pointerEvents: 'all',
            }}
          >
            {/* Ambient Radial Blue Glow */}
            <div
              style={{
                position: 'absolute',
                width: 600,
                height: 600,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(22,119,255,0.16) 0%, transparent 70%)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />

            {/* Glowing 3D Quantum Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'relative', zIndex: 2, marginBottom: '1.75rem' }}
            >
              <QuantumLogo
                width={100}
                height={100}
                style={{ filter: 'drop-shadow(0 0 32px rgba(56,189,248,0.8))' }}
              />
            </motion.div>

            {/* Welcoming Message Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.45 }}
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.78rem',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: '#38BDF8',
                marginBottom: '0.75rem',
                zIndex: 2,
              }}
            >
              WELCOME TO
            </motion.div>

            {/* QUANTUM AI Title */}
            <motion.div
              initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                zIndex: 2,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans, sans-serif)',
                  fontWeight: 700,
                  fontSize: '1.35rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: '#F8FAFF',
                }}
              >
                QUANTUM
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-sans, sans-serif)',
                  fontWeight: 900,
                  fontSize: '1.35rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(to right, #20A8FF, #55D6FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                AI
              </span>
            </motion.div>

            {/* Sub-tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 1.3, duration: 0.4 }}
              style={{
                marginTop: '1.25rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.72rem',
                letterSpacing: '0.2em',
                color: '#94A3B8',
                zIndex: 2,
              }}
            >
              INITIALIZING INTELLIGENT SYSTEMS...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main website content underneath */}
      <motion.div
        animate={{ opacity: phase === 'done' ? 1 : 0.9 }}
        transition={{ duration: 0.45 }}
      >
        {children}
      </motion.div>
    </>
  );
}
