'use client';

import React from 'react';

export function WebGLFallback() {
  return (
    <div style={styles.container}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rotate1 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rotate2 { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes pulse { 0% { transform: scale(0.9); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.8; } }
      `}} />
      <div style={styles.coreWrapper}>
        <div style={styles.outerRing}></div>
        <div style={styles.middleRing}></div>
        <div style={styles.innerRing}></div>
        <div style={styles.nucleus}></div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100vh',
    backgroundColor: '#030508',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  coreWrapper: {
    position: 'relative',
    width: '300px',
    height: '300px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    border: '1px dashed rgba(0, 200, 255, 0.3)',
    borderRadius: '50%',
    animation: 'rotate1 20s linear infinite',
  },
  middleRing: {
    position: 'absolute',
    width: '75%',
    height: '75%',
    border: '2px solid rgba(124, 58, 237, 0.4)',
    borderRadius: '50%',
    animation: 'rotate2 15s linear infinite',
  },
  innerRing: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    border: '2px dotted rgba(0, 200, 255, 0.6)',
    borderRadius: '50%',
    animation: 'rotate1 10s linear infinite',
  },
  nucleus: {
    position: 'absolute',
    width: '20%',
    height: '20%',
    backgroundColor: '#00c8ff',
    borderRadius: '50%',
    boxShadow: '0 0 30px #00c8ff, 0 0 60px #7c3aed',
    animation: 'pulse 2s ease-in-out infinite',
  }
};
