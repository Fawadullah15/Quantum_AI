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

  update(mouseX: number, mouseY: number, mouseRadius: number, mouseForce: number) {
    // Distance from mouse
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < mouseRadius) {
      // Calculate repulsion force
      const forceDirectionX = dx / distance;
      const forceDirectionY = dy / distance;
      const force = (mouseRadius - distance) / mouseRadius; // 0 to 1
      
      const repelX = forceDirectionX * force * mouseForce * -1;
      const repelY = forceDirectionY * force * mouseForce * -1;

      this.vx += repelX;
      this.vy += repelY;
    }

    // Spring back to origin
    this.vx += (this.originX - this.x) * this.ease;
    this.vy += (this.originY - this.y) * this.ease;

    // Apply friction
    this.vx *= this.friction;
    this.vy *= this.friction;

    // Update position
    this.x += this.vx;
    this.y += this.vy;
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
        const metrics = offCtx.measureText(line);
        // Left align or center align? Let's use left align for the specific design
        // The original design has it upper-left or centered. The spec says "Left or upper-left".
        // We'll just draw it with a 0 x offset, or maybe center it vertically.
        // Actually, let's start at x=0 for clean left alignment, or maybe 10px padding.
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

    const animate = () => {
      ctx.clearRect(0, 0, cw, ch);
      
      const { x: mx, y: my } = mouseRef.current;

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.update(mx, my, mouseRadius, mouseRepelForce);
        p.draw(ctx);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => {
      cancelAnimationFrame(animationRef.current);
      init();
      animate();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      container?.removeEventListener('mouseleave', handleMouseLeave);
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
