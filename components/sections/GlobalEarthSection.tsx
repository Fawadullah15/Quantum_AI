'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const PremiumGlobe = dynamic(() => import('@/components/3d/PremiumGlobe'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748B',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '0.85rem',
      }}
    >
      INITIALIZING NEURAL GLOBE MATRIX...
    </div>
  ),
});

const REGIONS = [
  { id: 'na', label: 'NORTH AMERICA', subLabel: 'US-East (Virginia) · US-West (Oregon)', ping: '18ms', active: true },
  { id: 'eu', label: 'EUROPE', subLabel: 'EU-West (London) · EU-Central (Frankfurt)', ping: '24ms', active: true },
  { id: 'me', label: 'MIDDLE EAST', subLabel: 'ME-Central (Dubai) · Data Gateway', ping: '32ms', active: true },
  { id: 'sa', label: 'SOUTH ASIA', subLabel: 'AP-South (Mumbai · Lahore Core)', ping: '38ms', active: true },
  { id: 'ea', label: 'EAST ASIA', subLabel: 'AP-Northeast (Tokyo) · AP-East (Singapore)', ping: '42ms', active: true },
];

export default function GlobalEarthSection() {
  const [selectedRegion, setSelectedRegion] = useState<string>('sa');
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const total = rect.height + windowHeight;
      const current = windowHeight - rect.top;
      const progress = Math.max(0, Math.min(1, current / total));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        padding: 'clamp(5rem, 12vh, 10rem) clamp(1.25rem, 6vw, 6rem)',
        backgroundColor: 'rgba(2, 8, 23, 0.75)',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(22, 119, 255, 0.12)',
        borderBottom: '1px solid rgba(22, 119, 255, 0.12)',
        pointerEvents: 'auto',
      }}
      aria-label="Global 3D Intelligent Infrastructure"
    >
      {/* Background Ambient Radial Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(400px, 70vw, 900px)',
          height: 'clamp(400px, 70vw, 900px)',
          background: 'radial-gradient(circle, rgba(0, 85, 255, 0.12) 0%, rgba(56, 189, 248, 0.04) 45%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 5vh, 3.5rem)' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#1677FF',
              marginBottom: '1rem',
              fontWeight: 600,
            }}
          >
            SYS.05 / GLOBAL INFRASTRUCTURE
          </p>
          <h2
            style={{
              fontSize: 'clamp(2.25rem, 5.5vw, 4.25rem)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: '#F8FAFF',
              textTransform: 'uppercase',
              margin: '0 auto 1rem',
              maxWidth: 900,
            }}
          >
            Worldwide Intelligent Systems.
          </h2>
          <p
            style={{
              fontSize: '1.15rem',
              color: '#94A3B8',
              lineHeight: 1.6,
              maxWidth: 680,
              margin: '0 auto',
              fontWeight: 300,
            }}
          >
            Real-time neural computation, multi-agent workflows, and distributed database clusters deployed seamlessly across global edge nodes.
          </p>
        </div>

        {/* 3D Globe Interactive Canvas */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(440px, 58vh, 680px)',
            margin: '0 auto',
            borderRadius: 24,
            overflow: 'hidden',
          }}
        >
          <PremiumGlobe
            globeRadius={1}
            oceanColor="#030712"
            oceanAlpha={0.95}
            dotColor="#E2E8F0"
            dotDensity={115}
            dotSize={0.36}
            lineColor="#00F0FF"
            lineThickness={1.5}
            glowColor="#0055FF"
            glowIntensity={2.4}
            atmosphereColor="rgba(0, 85, 255, 0.18)"
            autoRotateSpeed={0.5}
            enableDrag={true}
            scrollProgress={scrollProgress}
          />

          {/* Interactive Drag Prompt Overlay Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '1.25rem',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '0.4rem 1rem',
              backgroundColor: 'rgba(6, 21, 43, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 999,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#38BDF8',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>◈</span> CLICK & DRAG TO ROTATE 3D EARTH
          </div>
        </div>

        {/* Real-time Telemetry Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginTop: '3rem',
          }}
        >
          {[
            { label: 'EDGE LATENCY', val: '< 35ms', desc: 'Realtime planetary routing' },
            { label: 'GLOBAL UPTIME', val: '99.99%', desc: 'Autonomous node redundancy' },
            { label: 'ACTIVE REGIONS', val: '12+', desc: 'Dedicated cloud clusters' },
            { label: 'SECURITY ENCLAVES', val: 'ZERO-TRUST', desc: 'Encrypted token streams' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'rgba(6, 21, 43, 0.65)',
                border: '1px solid rgba(22, 119, 255, 0.18)',
                borderRadius: 12,
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#38BDF8';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(22, 119, 255, 0.18)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.68rem',
                  color: '#1677FF',
                  letterSpacing: '0.15em',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                0{idx + 1} / {item.label}
              </span>
              <div
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  color: '#F8FAFF',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {item.val}
              </div>
              <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 300 }}>
                {item.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Global Cluster Node Selector */}
        <div style={{ marginTop: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              scrollbarWidth: 'none',
            }}
          >
            {REGIONS.map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                data-trail="link"
                style={{
                  flex: '1 1 200px',
                  minWidth: 200,
                  padding: '0.85rem 1.15rem',
                  borderRadius: 10,
                  backgroundColor:
                    selectedRegion === reg.id
                      ? 'rgba(22, 119, 255, 0.18)'
                      : 'rgba(6, 21, 43, 0.45)',
                  border:
                    selectedRegion === reg.id
                      ? '1px solid #38BDF8'
                      : '1px solid rgba(22, 119, 255, 0.15)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow:
                    selectedRegion === reg.id ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: selectedRegion === reg.id ? '#38BDF8' : '#F8FAFF',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {reg.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.68rem',
                      color: '#10B981',
                      fontWeight: 600,
                    }}
                  >
                    {reg.ping}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 300 }}>
                  {reg.subLabel}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
