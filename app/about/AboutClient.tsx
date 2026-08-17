'use client';

import React from 'react';
import Image from 'next/image';

export default function AboutClient({ founders, team }: { founders: any[], team: any[] }) {
  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) * 2)' }} className="container section">
      <div style={{ marginBottom: 'var(--space-48)' }}>
        <div className="tech-label">SYS.00 / ORIGIN</div>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 10rem)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em', color: 'var(--color-text-primary)', textTransform: 'uppercase', marginBottom: 'var(--space-12)' }}>
          WE BUILD<br />SYSTEMS<br />THAT THINK.
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
           <div></div>
           <p style={{ fontSize: '1.5rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '600px', fontWeight: 300 }}>
             QUANTUM_AI is an applied research and engineering group. We design, deploy, and scale intelligence systems for ambitious organizations.
           </p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-16)' }}>
        <div className="tech-label" style={{ marginBottom: 'var(--space-16)' }}>LEADERSHIP</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
          {founders.map((founder, i) => (
            <div key={founder.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-12)' }}>
              
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: 'var(--color-surface)' }}>
                {founder.photo ? (
                  <Image src={founder.photo} alt={founder.name} fill style={{ objectFit: 'cover', filter: 'grayscale(100%) contrast(1.2)' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: 'var(--color-border-2)' }}>NO_IMAGE_DATA</div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-core)', marginBottom: '1rem', letterSpacing: '0.2em', fontSize: '0.75rem' }}>{String(i + 1).padStart(2, '0')}</div>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.03em', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                  {founder.name}
                </h2>
                <div style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-6)', textTransform: 'uppercase' }}>
                  {founder.role}
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, maxWidth: '500px' }}>
                  {founder.bio}
                </p>
              </div>

            </div>
          ))}
        </div>
        
        <div style={{ marginTop: 'var(--space-16)', textAlign: 'center' }}>
           <a href="/leadership" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
              letterSpacing: '0.2em', color: 'var(--color-text-primary)',
              textDecoration: 'none', borderBottom: '1px solid var(--color-border-2)', paddingBottom: '0.25rem',
              transition: 'border-color 0.2s',
            }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-core)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-2)'}>
              VIEW FULL LEADERSHIP PROFILES ↗
            </a>
        </div>
      </div>
    </div>
  )
}
