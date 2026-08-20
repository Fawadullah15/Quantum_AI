'use client';

import React, { useEffect } from 'react';
import { GlobalProvider, useGlobalStore } from './GlobalStore';
import { GlobalSceneWrapper } from '../3d/GlobalSceneWrapper';
import { usePathname } from 'next/navigation';
import WelcomeIntro from './WelcomeIntro';

function RouteController({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setCurrentScene } = useGlobalStore();

  useEffect(() => {
    if (pathname === '/')                       setCurrentScene('room');
    else if (pathname.startsWith('/products'))  setCurrentScene('products');
    else if (pathname.startsWith('/work'))      setCurrentScene('work');
    else if (pathname.startsWith('/technology') || pathname.startsWith('/technologies')) setCurrentScene('technology');
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
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <GlobalSceneWrapper />
      </div>

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
