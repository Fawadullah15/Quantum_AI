'use client';

import React, { useEffect, useRef } from 'react';
import { GlobalProvider, useGlobalStore } from './GlobalStore';
import { GlobalSceneWrapper } from '../3d/GlobalSceneWrapper';
import { usePathname } from 'next/navigation';
import WelcomeIntro from './WelcomeIntro';

function EarthSceneContainer({ isHome }: { isHome: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!isHome) {
      el.style.opacity = '1';
      return;
    }

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) return;
          const y = window.scrollY || document.documentElement.scrollTop || 0;

          // As user begins scrolling (from 15px to 200px), Earth smoothly emerges into deep space
          // Top of page (y <= 15): opacity 0 (Mars in hero takes focus)
          // As soon as user scrolls past 15px: Earth appears and stays with user along the website!
          const fadeStart = 15;
          const fadeEnd = 200;

          if (y <= fadeStart) {
            containerRef.current.style.opacity = '0';
          } else if (y >= fadeEnd) {
            containerRef.current.style.opacity = '1';
          } else {
            const progress = (y - fadeStart) / (fadeEnd - fadeStart);
            containerRef.current.style.opacity = progress.toFixed(3);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        opacity: isHome ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: 'none',
      }}
    >
      <GlobalSceneWrapper />
    </div>
  );
}

function RouteController({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setCurrentScene } = useGlobalStore();

  useEffect(() => {
    if (pathname === '/')                       setCurrentScene('room');
    else if (pathname.startsWith('/products'))  setCurrentScene('products');
    else if (pathname.startsWith('/work'))      setCurrentScene('work');
    else if (pathname.startsWith('/technology'))setCurrentScene('technology');
    else if (pathname.startsWith('/systems'))   setCurrentScene('systems');
    else if (pathname.startsWith('/about'))     setCurrentScene('about');
    else if (pathname.startsWith('/leadership'))setCurrentScene('leadership');
    else if (pathname.startsWith('/contact'))   setCurrentScene('contact');
    else if (pathname.startsWith('/research'))  setCurrentScene('research');
    else if (pathname.startsWith('/services'))  setCurrentScene('services');
    else if (pathname.startsWith('/industries'))setCurrentScene('industries');
    else if (pathname.startsWith('/philosophy'))setCurrentScene('philosophy');
    else if (pathname.startsWith('/careers'))   setCurrentScene('careers');
    else if (pathname.startsWith('/insights') || pathname.startsWith('/blog')) setCurrentScene('insights');
    else                                        setCurrentScene('room');
  }, [pathname, setCurrentScene]);

  const isHome = pathname === '/';
  const isAdmin = pathname.startsWith('/admin');

  // Don't apply WelcomeIntro or 3D scene in admin routes
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <WelcomeIntro>
      <EarthSceneContainer isHome={isHome} />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: isHome ? '100vh' : 'auto',
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          {children}
        </div>
      </div>
    </WelcomeIntro>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalProvider>
      <RouteController>
        {children}
      </RouteController>
    </GlobalProvider>
  );
}
