'use client';

import React, { useRef, useEffect } from 'react';

interface ParticleTextProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  textColor?: string;
  particleDensity?: number; // Lower is denser (gap between scanned pixels)
  particleSize?: number;
  friction?: number;
  ease?: number;
  mouseRadius?: number;
  mouseRepelForce?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
}

class Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  friction: number;
  ease: number;

  constructor(x: number, y: number, color: string, size: number, friction: number, ease: number) {
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
    this.color = color;
    this.size = size;
    this.vx = 0;
    this.vy = 0;
    this.friction = friction;
    this.ease = ease;
  }

  update(mouseX: number, mouseY: number, mouseRadius: number, mouseForce: number, repelStrength: number) {
    if (repelStrength > 0) {
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouseRadius) {
        let forceDirectionX: number;
        let forceDirectionY: number;

        if (distance < 0.1) {
          const angle = Math.random() * Math.PI * 2;
          forceDirectionX = Math.cos(angle);
          forceDirectionY = Math.sin(angle);
        } else {
          forceDirectionX = dx / distance;
          forceDirectionY = dy / distance;
        }

        const force = (mouseRadius - distance) / mouseRadius; // 0 to 1
        const effectiveForce = mouseForce * repelStrength;
        const repelX = forceDirectionX * force * effectiveForce * -1;
        const repelY = forceDirectionY * force * effectiveForce * -1;

        this.vx += repelX;
        this.vy += repelY;
      }
    }

    // Spring back to origin
    this.vx += (this.originX - this.x) * this.ease;
    this.vy += (this.originY - this.y) * this.ease;

    // Apply friction with subtle return stabilization
    const currentFriction = this.friction * (0.95 + 0.05 * repelStrength);
    this.vx *= currentFriction;
    this.vy *= currentFriction;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Crisp typography lock-in when returning and near resting origin (zero drift)
    if (repelStrength <= 0) {
      const distOriginSq = (this.originX - this.x) ** 2 + (this.originY - this.y) ** 2;
      const velSq = this.vx ** 2 + this.vy ** 2;
      if (distOriginSq < 0.16 && velSq < 0.04) {
        this.x = this.originX;
        this.y = this.originY;
        this.vx = 0;
        this.vy = 0;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function ParticleText({
  text,
  fontSize = 120,
  fontFamily = 'var(--font-space-grotesk), sans-serif',
  fontWeight = 700,
  textColor = '#ffffff',
  particleDensity = 4, // Process every Nth pixel
  particleSize = 1.5,
  friction = 0.85,
  ease = 0.05,
  mouseRadius = 100,
  mouseRepelForce = 10,
  width = '100%',
  height = '100%',
  className = '',
}: ParticleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const lastInteractionRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  // Parse multiline text (split by newlines or <br/> roughly)
  const lines = text.split('\n');

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    // Cap DPR on mobile for performance
    if (window.innerWidth < 768) dpr = Math.min(dpr, 1.5);

    let cw = 0;
    let ch = 0;

    const init = () => {
      const rect = container.getBoundingClientRect();
      cw = rect.width;
      ch = rect.height;

      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      
      ctx.scale(dpr, dpr);

      // Create offscreen canvas for text rendering
      const offCanvas = document.createElement('canvas');
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCanvas.width = cw * dpr;
      offCanvas.height = ch * dpr;
      offCtx.scale(dpr, dpr);

      // Responsive font size adjustments
      let actualFontSize = fontSize;
      let actualDensity = particleDensity;
      if (cw < 768) {
        actualFontSize = fontSize * 0.5; // Scale down font on mobile
        actualDensity = particleDensity * 1.5; // Less dense on mobile for perf
      } else if (cw < 1024) {
        actualFontSize = fontSize * 0.75;
      }

      offCtx.font = `${fontWeight} ${actualFontSize}px ${fontFamily}`;
      offCtx.fillStyle = textColor;
      offCtx.textAlign = 'left';
      offCtx.textBaseline = 'top';

      // Smart wrapping & centering
      const lineHeight = actualFontSize * 1.1;
      const totalHeight = lines.length * lineHeight;
      const startY = (ch - totalHeight) / 2;

      lines.forEach((line, i) => {
        offCtx.fillText(line, 0, startY + i * lineHeight);
      });

      // Scan pixels
      const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
      const newParticles: Particle[] = [];

      // Step size determines density
      const step = Math.max(1, Math.floor(actualDensity * dpr));

      for (let y = 0; y < offCanvas.height; y += step) {
        for (let x = 0; x < offCanvas.width; x += step) {
          const idx = (y * offCanvas.width + x) * 4;
          const alpha = imgData[idx + 3];

          if (alpha > 128) {
            // Found a text pixel. Map back to logical coordinates.
            const logicalX = x / dpr;
            const logicalY = y / dpr;
            
            // Randomize spawn position slightly for an entrance effect
            const spawnX = logicalX + (Math.random() - 0.5) * 50;
            const spawnY = logicalY + (Math.random() - 0.5) * 50;

            newParticles.push(
              new Particle(spawnX, spawnY, textColor, particleSize, friction, ease)
            );
            
            // Set true origin
            newParticles[newParticles.length - 1].originX = logicalX;
            newParticles[newParticles.length - 1].originY = logicalY;
          }
        }
      }

      particlesRef.current = newParticles;
    };

    let isVisible = true;

    // Timing constants for natural dispersion hold and smooth return
    const HOLD_MS = 100;
    const DECAY_MS = 300;

    const animate = () => {
      if (!isVisible) return;

      ctx.clearRect(0, 0, cw, ch);
      
      const { x: mx, y: my } = mouseRef.current;
      const now = performance.now();
      const elapsed = now - lastInteractionRef.current;

      let repelStrength = 0;
      if (elapsed < HOLD_MS) {
        repelStrength = 1.0;
      } else if (elapsed < HOLD_MS + DECAY_MS) {
        const p = (elapsed - HOLD_MS) / DECAY_MS;
        repelStrength = 1.0 - (p * p * (3 - 2 * p));
      }

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.update(mx, my, mouseRadius, mouseRepelForce, repelStrength);
        p.draw(ctx);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    init();
    animate();

    // Pause animation when hero is outside the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        const currentlyVisible = entry.isIntersecting;
        if (currentlyVisible && !isVisible) {
          isVisible = true;
          cancelAnimationFrame(animationRef.current);
          animate();
        } else if (!currentlyVisible && isVisible) {
          isVisible = false;
          cancelAnimationFrame(animationRef.current);
        }
      },
      { threshold: 0.05 }
    );

    if (container) {
      observer.observe(container);
    }

    const handleResize = () => {
      cancelAnimationFrame(animationRef.current);
      init();
      if (isVisible) {
        animate();
      }
    };

    const lastMovePos = { x: -9999, y: -9999 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!container || !isVisible) return;
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      const isNear = 
        clientX >= rect.left - mouseRadius &&
        clientX <= rect.right + mouseRadius &&
        clientY >= rect.top - mouseRadius &&
        clientY <= rect.bottom + mouseRadius;

      if (!isNear) {
        if (mouseRef.current.x !== -9999) {
          mouseRef.current.x = -9999;
          mouseRef.current.y = -9999;
        }
        return;
      }

      const distMoved = Math.hypot(clientX - lastMovePos.x, clientY - lastMovePos.y);
      if (distMoved >= 2.5) {
        lastMovePos.x = clientX;
        lastMovePos.y = clientY;
        mouseRef.current.x = clientX - rect.left;
        mouseRef.current.y = clientY - rect.top;
        lastInteractionRef.current = performance.now();
      }
    };

    const handlePointerDown = (e: PointerEvent | MouseEvent) => {
      if (!container || !isVisible) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= -30 && x <= rect.width + 30 && y >= -30 && y <= rect.height + 30) {
        mouseRef.current.x = x;
        mouseRef.current.y = y;
        lastMovePos.x = e.clientX;
        lastMovePos.y = e.clientY;
        lastInteractionRef.current = performance.now();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!container || !isVisible || !e.touches[0]) return;
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (x >= -30 && x <= rect.width + 30 && y >= -30 && y <= rect.height + 30) {
        mouseRef.current.x = x;
        mouseRef.current.y = y;
        lastMovePos.x = touch.clientX;
        lastMovePos.y = touch.clientY;
        lastInteractionRef.current = performance.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!container || !isVisible || !e.touches[0]) return;
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      const clientX = touch.clientX;
      const clientY = touch.clientY;

      const isNear = 
        clientX >= rect.left - mouseRadius &&
        clientX <= rect.right + mouseRadius &&
        clientY >= rect.top - mouseRadius &&
        clientY <= rect.bottom + mouseRadius;

      if (isNear) {
        const distMoved = Math.hypot(clientX - lastMovePos.x, clientY - lastMovePos.y);
        if (distMoved >= 2.5) {
          lastMovePos.x = clientX;
          lastMovePos.y = clientY;
          mouseRef.current.x = clientX - rect.left;
          mouseRef.current.y = clientY - rect.top;
          lastInteractionRef.current = performance.now();
        }
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
      lastMovePos.x = -9999;
      lastMovePos.y = -9999;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      container?.removeEventListener('pointerdown', handlePointerDown);
      container?.removeEventListener('touchstart', handleTouchStart);
      container?.removeEventListener('touchmove', handleTouchMove);
      container?.removeEventListener('mouseleave', handleMouseLeave);
      observer.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, [text, lines, fontSize, fontFamily, fontWeight, textColor, particleDensity, particleSize, friction, ease, mouseRadius, mouseRepelForce]);

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ width, height, position: 'relative', overflow: 'hidden' }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block', 
          width: '100%', 
          height: '100%',
          pointerEvents: 'none' // Let mouse events pass through if needed, but we track on window/container
        }} 
      />
      {/* Visually hidden text for accessibility and SEO */}
      <div 
        style={{ 
          position: 'absolute', 
          width: '1px', 
          height: '1px', 
          padding: 0, 
          margin: '-1px', 
          overflow: 'hidden', 
          clip: 'rect(0, 0, 0, 0)', 
          whiteSpace: 'nowrap', 
          borderWidth: 0 
        }}
      >
        {text}
      </div>
    </div>
  );
}
