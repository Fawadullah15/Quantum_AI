'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

interface WorkDesktopClientProps {
  caseStudies: any[];
  categories: string[];
  activeCategory: string;
}

const getProjectImage = (study: any) => {
  if (study.heroImage) return study.heroImage;
  if (study.gallery && study.gallery !== "[]") {
    try {
      const parsed = JSON.parse(study.gallery);
      if (parsed && parsed.length > 0) return parsed[0];
    } catch(e) {}
  }
  return "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2832&auto=format&fit=crop"; 
};

const Particles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{ duration: 40, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.08) 0%, transparent 60%)',
          backgroundSize: '150% 150%'
        }}
      />
    </div>
  );
};

const ProjectCard = ({ study, index, setCursorVisible, setCursorText }: { study: any, index: number, setCursorVisible: any, setCursorText: any }) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const imageScale = useSpring(1, { stiffness: 100, damping: 30 });
  const mouseXSpring = useSpring(x, { stiffness: 50, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / 25);
    y.set((e.clientY - centerY) / 25);
  };

  const handleMouseEnter = () => {
    setCursorText("EXPLORE");
    setCursorVisible(true);
    imageScale.set(1.04);
  };

  const handleMouseLeave = () => {
    setCursorVisible(false);
    imageScale.set(1);
    x.set(0);
    y.set(0);
  };

  const techList = study.technologies ? study.technologies.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
  const imageSrc = getProjectImage(study);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: (index % 2) * 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <Link
        href={`/work/${study.slug}`}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group block relative no-underline outline-none"
      >
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-[#06152B] border border-[#1677ff1a] transition-colors duration-500 group-hover:border-[#38bdf880]">
          <motion.div
            style={{
              x: mouseXSpring,
              y: mouseYSpring,
              scale: imageScale,
            }}
            className="w-full h-full relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent opacity-60 z-10" />
            <img 
              src={imageSrc} 
              alt={study.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#38bdf8] opacity-0 group-hover:opacity-10 mix-blend-overlay transition-opacity duration-500 z-20" />
          </motion.div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[#94A3B8] font-mono text-xs uppercase tracking-wider">
            <span>{String(index + 2).padStart(2, '0')} — {study.industry ? study.industry.split('/')[0].trim() : 'Technology'}</span>
            <span className="flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#38BDF8]">
              VIEW CASE STUDY <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <h3 className="text-2xl font-semibold text-[#F8FAFC] tracking-tight group-hover:text-[#38BDF8] transition-colors duration-300">
            {study.title}
          </h3>
          <p className="text-[#94A3B8] text-sm font-light leading-relaxed line-clamp-2 max-w-xl">
            {study.problem || study.solution}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

const FeaturedProject = ({ study, setCursorVisible, setCursorText }: { study: any, setCursorVisible: any, setCursorText: any }) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const imageScale = useSpring(1, { stiffness: 100, damping: 30 });
  const mouseXSpring = useSpring(x, { stiffness: 50, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / 35);
    y.set((e.clientY - centerY) / 35);
  };

  const handleMouseEnter = () => {
    setCursorText("VIEW PROJECT");
    setCursorVisible(true);
    imageScale.set(1.03);
  };

  const handleMouseLeave = () => {
    setCursorVisible(false);
    imageScale.set(1);
    x.set(0);
    y.set(0);
  };

  const techList = study.technologies ? study.technologies.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
  const imageSrc = getProjectImage(study);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="mb-32 mt-16"
    >
      <div className="flex items-center justify-between mb-8 border-b border-[#1677ff1a] pb-4">
        <span className="font-mono text-sm tracking-[0.2em] text-[#1677FF] uppercase">FEATURED PROJECT</span>
        <span className="font-mono text-xs tracking-wider text-[#64748B]">01 / 01</span>
      </div>

      <Link
        href={`/work/${study.slug}`}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group flex gap-16 relative no-underline outline-none items-center"
      >
        <div className="w-1/3 flex flex-col gap-6 z-10 relative">
          <div className="font-mono text-xs text-[#38BDF8] tracking-widest uppercase bg-[#1677ff1a] self-start px-3 py-1 rounded border border-[#38bdf833]">
            {study.industry ? study.industry.split('/')[0].trim() : 'Technology'}
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#F8FAFC] tracking-tight leading-tight group-hover:text-[#38BDF8] transition-colors duration-500">
            {study.title}
          </h2>
          <p className="text-[#94A3B8] text-base font-light leading-relaxed">
            {study.problem || study.solution}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {techList.slice(0, 4).map((t: string) => (
              <span key={t} className="font-mono text-[10px] text-[#55D6FF] bg-[#1677ff14] border border-[#1677ff29] px-2 py-1 rounded">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm font-mono tracking-widest text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors duration-300">
            VIEW CASE STUDY <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
          </div>
        </div>

        <div className="w-2/3 relative rounded-2xl overflow-hidden aspect-[16/10] bg-[#06152B] border border-[#1677ff1a] transition-colors duration-500 group-hover:border-[#38bdf866] shadow-2xl">
          <motion.div
            style={{
              x: mouseXSpring,
              y: mouseYSpring,
              scale: imageScale,
            }}
            className="w-full h-full relative"
          >
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#030712] opacity-40 z-10" />
            <img 
              src={imageSrc} 
              alt={study.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#38BDF8] opacity-0 group-hover:opacity-10 mix-blend-overlay transition-opacity duration-700 z-20" />
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function WorkDesktopClient({ caseStudies, categories, activeCategory }: WorkDesktopClientProps) {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorXSpring = useSpring(cursorX, { damping: 25, stiffness: 300, mass: 0.5 });
  const cursorYSpring = useSpring(cursorY, { damping: 25, stiffness: 300, mass: 0.5 });
  const [cursorText, setCursorText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
    <div className="relative min-h-screen bg-[var(--color-void,#030712)] text-white overflow-hidden pb-32" style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)' }}>
      {isClient && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          style={{
            x: cursorXSpring,
            y: cursorYSpring,
            translateX: "-50%",
            translateY: "-50%",
          }}
          initial={false}
          animate={{ 
            width: cursorVisible ? 96 : 0, 
            height: cursorVisible ? 96 : 0, 
            opacity: cursorVisible ? 1 : 0 
          }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <span className="text-[10px] font-mono font-bold tracking-widest text-center leading-tight">
            {cursorText}
          </span>
        </motion.div>
      )}

      <section className="relative w-full max-w-[1400px] mx-auto px-12 pt-16 pb-24 border-b border-[#1677ff1a]">
        <Particles />
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-mono text-sm tracking-[0.3em] text-[#1677FF] uppercase mb-6 font-semibold"
          >
            [04 — OUR WORK]
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-[4rem] lg:text-[5.5rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#F8FAFC] uppercase max-w-5xl mb-8"
          >
            SELECTED DEPLOYMENTS &<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-sky-400">
              CASE STUDIES.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg lg:text-xl text-[#94A3B8] max-w-2xl leading-relaxed font-light"
          >
            Production software platforms, enterprise automation engines, and custom AI systems delivered by Quantum AI.
          </motion.p>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-12 mt-12">
        <div className="flex flex-wrap gap-3 mb-16">
          {categories.map((cat, i) => {
            const isActive = activeCategory === cat;
            const href = cat === 'ALL' ? '/work' : `/work?category=${encodeURIComponent(cat)}`;
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + (i * 0.05) }}
              >
                <Link
                  href={href}
                  className={`block font-mono text-[11px] tracking-widest uppercase px-5 py-2.5 rounded border transition-all duration-300 ${
                    isActive 
                      ? 'bg-[#1677ff22] border-[#38BDF8] text-[#38BDF8] font-semibold' 
                      : 'bg-[#06152B] border-[#1677ff22] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#38bdf880]'
                  }`}
                >
                  {cat}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {caseStudies.length === 0 ? (
          <div className="py-32 text-center border border-dashed border-[#1677ff33] rounded-2xl bg-[#06152B]/30">
            <div className="font-mono text-sm tracking-widest text-[#1677FF] mb-4">NO MATCHING DEPLOYMENTS</div>
            <h2 className="text-2xl font-semibold text-white mb-4">No Case Studies Found in This Category</h2>
            <Link href="/work" className="font-mono text-sm tracking-wider text-[#38BDF8] hover:text-white transition-colors">
              VIEW ALL WORK →
            </Link>
          </div>
        ) : (
          <>
            {featuredStudy && (
              <FeaturedProject 
                study={featuredStudy} 
                setCursorVisible={setCursorVisible} 
                setCursorText={setCursorText} 
              />
            )}

            {remainingStudies.length > 0 && (
              <div className="grid grid-cols-2 gap-x-12 gap-y-20">
                {remainingStudies.map((study, index) => (
                  <ProjectCard 
                    key={study.id} 
                    study={study} 
                    index={index} 
                    setCursorVisible={setCursorVisible} 
                    setCursorText={setCursorText} 
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
