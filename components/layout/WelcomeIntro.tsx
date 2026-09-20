'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './BrandReveal.module.css';

/**
 * Premium Brand Reveal — Quantum AI Opening Identity Sequence
 *
 * A cinematic ~3.2 s brand reveal that plays once per browser session.
 * Phase state machine: glow → logo → wordmark → hold → dissolve → done
 *
 * - Session-gated via sessionStorage('quantum-ai-brand-seen')
 * - Respects prefers-reduced-motion
 * - Click / key press skips to dissolve
 * - 5 s hard-timeout failsafe
 */

const SESSION_KEY = 'quantum-ai-brand-seen';

// Precise, calm easing — no spring, no bounce
const easePrecise: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const easeStandard: [number, number, number, number] = [0.4, 0, 0.2, 1];

type Phase = 'glow' | 'logo' | 'wordmark' | 'hold' | 'dissolve' | 'done';

export default function WelcomeIntro({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase | null>(null); // null = not yet determined
  const phaseRef = useRef<Phase | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ── Initialisation ─────────────────────────────────────────
  useEffect(() => {
    // Reduced motion → skip entirely
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      markSeen();
      setPhase('done');
      return;
    }

    // Session check → skip if already seen
    try {
      if (sessionStorage.getItem(SESSION_KEY) === 'true') {
        setPhase('done');
        return;
      }
    } catch {
      // sessionStorage unavailable — play animation anyway
    }

    // Start the sequence
    setPhase('glow');

    // Schedule phase transitions
    const t1 = setTimeout(() => setPhase('logo'), 400);
    const t2 = setTimeout(() => setPhase('wordmark'), 1200);
    const t3 = setTimeout(() => setPhase('hold'), 1800);
    const t4 = setTimeout(() => setPhase('dissolve'), 2400);
    const t5 = setTimeout(() => {
      markSeen();
      setPhase('done');
    }, 3200);

    // Hard timeout failsafe
    const tSafe = setTimeout(() => {
      markSeen();
      setPhase('done');
    }, 5000);

    timeoutsRef.current = [t1, t2, t3, t4, t5, tSafe];

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // ── Skip mechanism ─────────────────────────────────────────
  const handleSkip = useCallback(() => {
    const current = phaseRef.current;
    if (!current || current === 'done' || current === 'dissolve') return;

    // Clear scheduled transitions
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Jump to dissolve, then done
    setPhase('dissolve');
    const t = setTimeout(() => {
      markSeen();
      setPhase('done');
    }, 600);
    timeoutsRef.current = [t];
  }, []);

  useEffect(() => {
    if (phase === 'done' || phase === null) return;

    const onKey = (e: KeyboardEvent) => {
      // Don't skip on Tab (accessibility navigation)
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

  // Not yet determined (SSR / first paint) — render children only
  if (phase === null) {
    return <>{children}</>;
  }

  // Animation complete — render children only (overlay removed from DOM)
  if (phase === 'done') {
    return <>{children}</>;
  }

  // Active animation phases
  const showLogo = phase === 'logo' || phase === 'wordmark' || phase === 'hold' || phase === 'dissolve';
  const showWordmark = phase === 'wordmark' || phase === 'hold' || phase === 'dissolve';
  const isDissolving = phase === 'dissolve';

  return (
    <>
      <AnimatePresence>
        {phase !== 'done' && (
          <motion.div
            key="brand-reveal"
            className={styles.overlay}
            initial={{ opacity: 1 }}
            animate={{ opacity: isDissolving ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isDissolving ? 0.8 : 0.3, ease: easeStandard }}
            onAnimationComplete={() => {
              if (isDissolving) {
                markSeen();
                setPhase('done');
              }
            }}
            role="presentation"
            aria-hidden="true"
          >
            {/* ── Ambient radial glow ── */}
            <motion.div
              className={styles.glow}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{
                opacity: isDissolving ? 0 : phase === 'glow' ? 0.4 : 0.7,
                scale: isDissolving ? 1.3 : phase === 'glow' ? 0.8 : 1.0,
              }}
              transition={{ duration: 0.8, ease: easePrecise }}
            />

            {/* ── Logo ── */}
            <motion.div
              className={styles.logoContainer}
              initial={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
              animate={{
                opacity: showLogo ? 1 : 0,
                scale: showLogo ? 1 : 0.92,
                filter: showLogo ? 'blur(0px)' : 'blur(4px)',
              }}
              transition={{ duration: 0.7, ease: easePrecise }}
            >
              {/* Using <img> intentionally — this overlay is ephemeral and removed from DOM after 3.2s.
                  next/image optimisation overhead is unnecessary here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/quantum-q-logo.png"
                alt=""
                className={styles.logo}
                draggable={false}
              />
            </motion.div>

            {/* ── Wordmark: QUANTUM AI ── */}
            <motion.div
              className={styles.wordmark}
              initial={{ opacity: 0 }}
              animate={{ opacity: showWordmark ? 1 : 0 }}
              transition={{ duration: 0.5, ease: easePrecise }}
            >
              <motion.span
                className={styles.wordmarkQuantum}
                initial={{ letterSpacing: '0.5em', opacity: 0 }}
                animate={{
                  letterSpacing: showWordmark ? '0.25em' : '0.5em',
                  opacity: showWordmark ? 1 : 0,
                }}
                transition={{ duration: 0.55, ease: easePrecise }}
              >
                QUANTUM
              </motion.span>
              <motion.span
                className={styles.wordmarkAI}
                initial={{ opacity: 0 }}
                animate={{ opacity: showWordmark ? 1 : 0 }}
                transition={{ duration: 0.45, delay: 0.1, ease: easePrecise }}
              >
                AI
              </motion.span>
            </motion.div>

            {/* ── Skip hint ── */}
            <motion.div
              className={styles.skipHint}
              initial={{ opacity: 0 }}
              animate={{ opacity: showWordmark && !isDissolving ? 0.5 : 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: easeStandard }}
            >
              Click to skip
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main website content — always rendered underneath */}
      <motion.div
        animate={{ opacity: phase === 'done' ? 1 : 0.85 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </>
  );
}

/** Mark the brand reveal as seen for this session */
function markSeen(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {
    // sessionStorage unavailable — fail silently
  }
}
