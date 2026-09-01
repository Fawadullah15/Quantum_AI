'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

interface WorkDesktopClientProps {
  caseStudies: any[];
  categories: string[];
  activeCategory: string;
}

const getProjectImage = (study: any) => {
  if (study.heroImage) return study.heroImage;
  if (study.gallery && study.gallery !== "[]" && study.gallery !== "") {
    try {
      const parsed = JSON.parse(study.gallery);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch(e) {}
  }
  return "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2832&auto=format&fit=crop"; 
};

// Subtle atmospheric background
const HeroBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="absolute inset-0 bg-[#030712]" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-[#1677ff] opacity-[0.03] blur-[140px] rounded-[100%]" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
    {/* Very subtle grid */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
  </div>
);

const FeaturedProject = ({ study, setCursorVisible, setCursorText }: { study: any, setCursorVisible: any, setCursorText: any }) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  
  const imageScale = useSpring(1, { stiffness: 100, damping: 30 });
  const mouseXSpring = useSpring(x, { stiffness: 60, damping: 20 });
  const arrowX = useSpring(0, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    // Parallax only horizontally, very subtle
    x.set((e.clientX - centerX) / 40);
  };

  const handleMouseEnter = () => {
    setCursorText("VIEW PROJECT");
    setCursorVisible(true);
    imageScale.set(1.035);
    arrowX.set(4);
  };

  const handleMouseLeave = () => {
    setCursorVisible(false);
    imageScale.set(1);
    x.set(0);
    arrowX.set(0);
  };

  const techList = study.technologies ? study.technologies.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
  const imageSrc = getProjectImage(study);
  const catLabel = study.industry ? study.industry.split('/')[0].trim() : 'Technology';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="mb-32 mt-12"
    >
      <Link
        href={`/work/${study.slug}`}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group flex flex-col lg:flex-row gap-16 relative no-underline outline-none items-center"
      >
        {/* LEFT: INFO */}
        <div className="w-full lg:w-[35%] flex flex-col gap-6 z-10 relative order-2 lg:order-1">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs text-[#64748B] tracking-[0.2em] uppercase">FEATURED PROJECT 01 / 01</span>
            <span className="text-[#38BDF8] text-sm tracking-widest uppercase">{catLabel}</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#F8FAFC] tracking-[-0.02em] leading-[1.1] transition-transform duration-500 group-hover:translate-x-1">
            {study.title}
          </h2>
          
          <p className="text-[#94A3B8] text-base lg:text-lg font-light leading-relaxed max-w-lg mt-2">
            {study.problem || study.solution}
          </p>
          
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 font-mono text-[11px] text-[#55D6FF]/80 uppercase tracking-wider">
            {techList.map((t: string, i: number) => (
              <span key={i} className="flex items-center gap-4">
                {t}
                {i < techList.length - 1 && <span className="text-white/20">/</span>}
              </span>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm font-semibold tracking-[0.15em] text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors duration-300">
            VIEW CASE STUDY 
            <motion.span style={{ x: arrowX }}>→</motion.span>
          </div>
        </div>

        {/* RIGHT: IMAGE */}
        <div className="w-full lg:w-[65%] relative rounded-xl overflow-hidden aspect-[16/10] bg-[#06152B] border border-white/[0.05] shadow-2xl transition-all duration-700 group-hover:border-white/[0.12] order-1 lg:order-2">
          <motion.div
            style={{ x: mouseXSpring, scale: imageScale }}
            className="w-full h-full relative"
          >
            {/* NO black overlays. Let the image shine. */}
            <img 
              src={imageSrc} 
              alt={study.title} 
              loading="lazy"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

const ProjectCard = ({ study, index, total, setCursorVisible, setCursorText }: { study: any, index: number, total: number, setCursorVisible: any, setCursorText: any }) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imageScale = useSpring(1, { stiffness: 100, damping: 30 });
  const arrowX = useSpring(0, { stiffness: 200, damping: 20 });

  const handleMouseEnter = () => {
    setCursorText("EXPLORE");
    setCursorVisible(true);
    imageScale.set(1.035);
    arrowX.set(4);
  };

  const handleMouseLeave = () => {
    setCursorVisible(false);
    imageScale.set(1);
    arrowX.set(0);
  };

  const imageSrc = getProjectImage(study);
  const catLabel = study.industry ? study.industry.split('/')[0].trim() : 'Technology';
  const numStr = String(index + 2).padStart(2, '0');
  const totalStr = String(total + 1).padStart(2, '0'); // +1 because of featured project

  return (
    <motion.div
      initial={{ opacity: 0, y: 35, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: (index % 2) * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="flex"
    >
      <Link
        href={`/work/${study.slug}`}
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group flex flex-col gap-6 relative no-underline outline-none w-full"
      >
        {/* Large Image Container */}
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#06152B] border border-white/[0.05] transition-all duration-500 group-hover:border-white/[0.12]">
          <motion.div
            style={{ scale: imageScale }}
            className="w-full h-full relative"
          >
            <img 
              src={imageSrc} 
              alt={study.title} 
              loading="lazy"
              className="w-full h-full object-cover object-center"
            />
            {/* Very subtle gradient at bottom ONLY for a tiny bit of depth, not darkness */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            
            {/* Hover indicator overlay (opacity 0 -> 1) */}
            <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 font-mono text-xs tracking-widest text-white z-10 font-medium">
              VIEW PROJECT <motion.span style={{ x: arrowX }}>→</motion.span>
            </div>
          </motion.div>
        </div>

        {/* Content Below Image */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 text-[#64748B] font-mono text-xs tracking-[0.15em] uppercase">
            <span>{numStr} / {totalStr}</span>
            <span className="w-4 h-[1px] bg-white/10" />
            <span className="text-[#38BDF8]">{catLabel}</span>
          </div>
          
          <h3 className="text-2xl xl:text-3xl font-semibold text-[#F8FAFC] tracking-[-0.01em] group-hover:text-[#38BDF8] transition-colors duration-300">
            {study.title}
          </h3>
          
          <p className="text-[#94A3B8] text-sm lg:text-base font-light leading-relaxed line-clamp-2">
            {study.problem || study.solution}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default function WorkDesktopClient({ caseStudies, categories, activeCategory }: WorkDesktopClientProps) {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorXSpring = useSpring(cursorX, { damping: 30, stiffness: 400, mass: 0.5 });
  const cursorYSpring = useSpring(cursorY, { damping: 30, stiffness: 400, mass: 0.5 });
  
  const [cursorText, setCursorText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Only enable custom cursor on non-touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  const featuredStudy = caseStudies.length > 0 ? caseStudies[0] : null;
  const remainingStudies = caseStudies.length > 1 ? caseStudies.slice(1) : [];

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-[#1677FF] selection:text-white pb-32 font-sans">
      <HeroBackground />

      {/* Custom Cursor */}
      {isClient && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center rounded-full backdrop-blur-md bg-black/40 border border-white/10 text-white shadow-[0_0_15px_rgba(56,189,248,0.15)] hidden lg:flex"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            translateX: "-50%",
            translateY: "-50%",
          }}
          initial={false}
          animate={{ 
            width: cursorVisible ? 84 : 0, 
            height: cursorVisible ? 84 : 0, 
            opacity: cursorVisible ? 1 : 0 
          }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
        >
          <span className="text-[9px] font-mono font-medium tracking-widest text-center leading-tight">
            {cursorText.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
          </span>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative w-full max-w-[1500px] mx-auto px-8 lg:px-12 pt-40 lg:pt-56 pb-16 lg:pb-24">
        <div className="relative z-10 flex flex-col items-start">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-xs tracking-[0.25em] text-[#64748B] uppercase mb-8"
          >
            [04 — OUR WORK]
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold leading-[1.05] tracking-[-0.02em] text-[#F8FAFC] uppercase max-w-4xl"
          >
            SELECTED<br />
            DEVELOPMENT<br />
            <span className="text-white/60">
              & CASE STUDIES.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg lg:text-xl text-[#94A3B8] max-w-2xl leading-relaxed font-light mt-10"
          >
            Production software platforms, enterprise automation engines, and custom AI systems delivered by Quantum AI.
          </motion.p>
        </div>
      </section>

      <div className="max-w-[1500px] mx-auto px-8 lg:px-12">
        {/* Category Filters (Horizontal Scrolling) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full overflow-x-auto no-scrollbar border-b border-white/[0.06] pb-8 mb-12"
        >
          <div className="flex flex-nowrap items-center gap-3 min-w-max">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const href = cat === 'ALL' ? '/work' : `/work?category=${encodeURIComponent(cat)}`;
              return (
                <Link
                  key={cat}
                  href={href}
                  className={`block font-mono text-[10px] lg:text-[11px] tracking-[0.15em] uppercase px-6 py-3 rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'bg-[#1677FF]/10 border border-[#1677FF]/30 text-[#55D6FF] font-semibold' 
                      : 'bg-transparent border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/30'
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {caseStudies.length === 0 ? (
              <div className="py-32 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
                <div className="font-mono text-sm tracking-widest text-[#64748B] mb-4 uppercase">No Projects Found</div>
                <h2 className="text-2xl font-semibold text-white mb-4">No case studies in this category yet.</h2>
                <Link href="/work" className="font-mono text-sm tracking-wider text-[#38BDF8] hover:text-white transition-colors">
                  VIEW ALL WORK →
                </Link>
              </div>
            ) : (
              <>
                {/* FEATURED PROJECT */}
                {featuredStudy && (
                  <FeaturedProject 
                    study={featuredStudy} 
                    setCursorVisible={setCursorVisible} 
                    setCursorText={setCursorText} 
                  />
                )}

                {/* DIVIDER */}
                {remainingStudies.length > 0 && (
                  <div className="flex justify-between items-center border-t border-white/[0.08] pt-6 mt-24 mb-16 font-mono text-xs tracking-widest text-[#64748B] uppercase">
                    <span>SELECTED WORK</span>
                    <span>{remainingStudies.length < 10 ? `0${remainingStudies.length}` : remainingStudies.length} PROJECTS</span>
                  </div>
                )}

                {/* GRID */}
                {remainingStudies.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 xl:gap-x-16 gap-y-24">
                    {remainingStudies.map((study, index) => (
                      <ProjectCard 
                        key={study.id} 
                        study={study} 
                        index={index} 
                        total={remainingStudies.length}
                        setCursorVisible={setCursorVisible} 
                        setCursorText={setCursorText} 
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
