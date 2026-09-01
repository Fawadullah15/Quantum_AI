'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useSpring, AnimatePresence, useReducedMotion } from 'framer-motion';

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
    } catch (e) {}
  }
  // No external placeholders per instruction. 
  // Return null so the component can render a clean structural fallback.
  return null; 
};

const HeroBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="absolute inset-0 bg-[#030712]" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-[#1677ff] opacity-[0.03] blur-[140px] rounded-[100%]" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
  </div>
);

const FeaturedProject = ({ study }: { study: any }) => {

  const shouldReduceMotion = useReducedMotion();
  
  const imageScale = useSpring(1, { stiffness: 100, damping: 30 });
  const arrowX = useSpring(0, { stiffness: 200, damping: 20 });

  const handleMouseEnter = () => {
    if (!shouldReduceMotion) {
      imageScale.set(1.03);
      arrowX.set(4);
    }
  };

  const handleMouseLeave = () => {
    if (!shouldReduceMotion) {
      imageScale.set(1);
      arrowX.set(0);
    }
  };

  const techList = study.technologies ? study.technologies.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
  const imageSrc = getProjectImage(study);
  const catLabel = study.industry ? study.industry.split('/')[0].trim() : 'Technology';

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="mb-32 mt-12"
    >
      <Link
        href={`/work/${study.slug}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group flex flex-col lg:flex-row gap-16 relative outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-8 focus-visible:ring-offset-[#030712] items-center rounded-xl"
        aria-label={`View featured project: ${study.title}`}
      >
        <div className="w-full lg:w-[35%] flex flex-col gap-6 z-10 relative order-2 lg:order-1">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs text-[#64748B] tracking-[0.2em] uppercase">FEATURED PROJECT 01 / 01</span>
            <span className="text-[#38BDF8] text-sm tracking-widest uppercase font-mono">{catLabel}{study.year ? ` / ${study.year}` : ''}</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#F8FAFC] tracking-[-0.02em] leading-[1.1] transition-all duration-500 group-hover:text-white group-hover:translate-x-2">
            {study.title}
          </h2>
          
          {/* Hide problem/solution if missing instead of showing empty */}
          {(study.problem || study.solution) && (
            <p className="text-[#94A3B8] text-base lg:text-lg font-light leading-relaxed max-w-lg mt-2 group-hover:text-[#cbd5e1] transition-colors duration-500">
              {study.problem || study.solution}
            </p>
          )}
          
          {techList.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 font-mono text-[11px] text-[#55D6FF]/70 uppercase tracking-wider">
              {techList.map((t: string, i: number) => (
                <span key={i} className="flex items-center gap-4">
                  {t}
                  {i < techList.length - 1 && <span className="text-white/20">/</span>}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center gap-3 text-sm font-semibold tracking-[0.15em] text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors duration-300">
            VIEW CASE STUDY 
            <motion.span style={{ x: arrowX }}>â†’</motion.span>
          </div>
        </div>

        <div className="w-full lg:w-[65%] relative rounded-xl overflow-hidden aspect-[16/10] bg-[#06152B] border border-white/[0.05] shadow-2xl transition-all duration-700 group-hover:border-white/[0.15] group-hover:shadow-[0_12px_40px_rgba(22,119,255,0.12)] order-1 lg:order-2">
          <motion.div
            style={{ scale: imageScale }}
            className="w-full h-full relative bg-[#030712] flex items-center justify-center origin-top"
          >
            {imageSrc ? (
              <Image 
                src={imageSrc} 
                alt={`Screenshot of ${study.title}`} 
                fill
                sizes="(max-width: 1024px) 100vw, 65vw"
                priority
                className="object-cover object-top"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-50" />
            )}
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

const ProjectCard = ({ study, index, total }: { study: any, index: number, total: number }) => {

  const shouldReduceMotion = useReducedMotion();
  const imageScale = useSpring(1, { stiffness: 100, damping: 30 });
  const arrowX = useSpring(0, { stiffness: 200, damping: 20 });

  const handleMouseEnter = () => {
    if (!shouldReduceMotion) {
      imageScale.set(1.03);
      arrowX.set(4);
    }
  };

  const handleMouseLeave = () => {
    if (!shouldReduceMotion) {
      imageScale.set(1);
      arrowX.set(0);
    }
  };

  const imageSrc = getProjectImage(study);
  const catLabel = study.industry ? study.industry.split('/')[0].trim() : 'Technology';
  const numStr = String(index + 2).padStart(2, '0');
  const totalStr = String(total + 1).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: shouldReduceMotion ? 0 : (index % 2) * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="flex"
    >
      <Link
        href={`/work/${study.slug}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group flex flex-col gap-6 relative outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-8 focus-visible:ring-offset-[#030712] w-full rounded-xl"
        aria-label={`View project: ${study.title}`}
      >
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#06152B] border border-white/[0.05] shadow-lg transition-all duration-700 group-hover:border-white/[0.12] group-hover:shadow-[0_8px_30px_rgba(22,119,255,0.08)]">
          <motion.div
            style={{ scale: imageScale }}
            className="w-full h-full relative bg-[#030712] origin-top"
          >
            {imageSrc ? (
              <Image 
                src={imageSrc} 
                alt={`Screenshot of ${study.title}`} 
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_20%,transparent_100%)] opacity-40" />
            )}
            
            {/* Minimal hover indicator overlay */}
            <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 font-mono text-xs tracking-widest text-white z-10 font-medium drop-shadow-md">
              VIEW PROJECT <motion.span style={{ x: arrowX }}>â†’</motion.span>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 text-[#64748B] font-mono text-xs tracking-[0.15em] uppercase">
            <span>{numStr} / {totalStr}</span>
            <span className="w-4 h-[1px] bg-white/10" />
            <span className="text-[#38BDF8]">{catLabel}{study.year ? ` / ${study.year}` : ''}</span>
          </div>
          
          <h3 className="text-2xl xl:text-3xl font-semibold text-[#F8FAFC] tracking-[-0.01em] transition-all duration-500 group-hover:text-white group-hover:translate-x-1">
            {study.title}
          </h3>
          
          {(study.problem || study.solution) && (
            <p className="text-[#94A3B8] text-sm lg:text-base font-light leading-relaxed line-clamp-2 group-hover:text-[#cbd5e1] transition-colors duration-500">
              {study.problem || study.solution}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default function WorkDesktopClient({ caseStudies, categories, activeCategory }: WorkDesktopClientProps) {
  const featuredStudy = caseStudies.length > 0 ? caseStudies[0] : null;
  const remainingStudies = caseStudies.length > 1 ? caseStudies.slice(1) : [];
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-[#030712] text-white selection:bg-[#1677FF] selection:text-white font-sans">
      <HeroBackground />

      {/* Hero Section */}
      <section className="relative w-full max-w-[1500px] mx-auto px-8 lg:px-12 pt-40 lg:pt-56 pb-16 lg:pb-24">
        <div className="relative z-10 flex flex-col items-start">
          <motion.div 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-xs tracking-[0.25em] text-[#64748B] uppercase mb-8"
          >
            [04 â€” OUR WORK]
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: shouldReduceMotion ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold leading-[1.05] tracking-[-0.02em] text-[#F8FAFC] uppercase max-w-5xl"
          >
            WORK THAT TURNS<br />
            INTELLIGENCE<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F8FAFC] to-[#64748B]">
              INTO IMPACT.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: shouldReduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg lg:text-xl text-[#94A3B8] max-w-2xl leading-relaxed font-light mt-10"
          >
            Quantum AI builds AI systems, software products, and digital experiences for real organizations.
          </motion.p>
        </div>
      </section>

      <div className="max-w-[1500px] mx-auto px-8 lg:px-12">
        {/* Category Filters */}
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: shouldReduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
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
                  className={`block font-mono text-[10px] lg:text-[11px] tracking-[0.15em] uppercase px-6 py-3 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
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
                  VIEW ALL WORK â†’
                </Link>
              </div>
            ) : (
              <>
                {featuredStudy && <FeaturedProject study={featuredStudy} />}

                {remainingStudies.length > 0 && (
                  <div className="flex justify-between items-center border-t border-white/[0.08] pt-6 mt-24 mb-16 font-mono text-xs tracking-widest text-[#64748B] uppercase">
                    <span>SELECTED WORK</span>
                    <span>{remainingStudies.length < 10 ? `0${remainingStudies.length}` : remainingStudies.length} PROJECTS</span>
                  </div>
                )}

                {remainingStudies.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 xl:gap-x-16 gap-y-24">
                    {remainingStudies.map((study, index) => (
                      <ProjectCard 
                        key={study.id} 
                        study={study} 
                        index={index} 
                        total={remainingStudies.length}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Closing CTA */}
      <section className="mt-32 border-t border-white/[0.06] py-32">
        <div className="max-w-[1500px] mx-auto px-8 lg:px-12 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-[#F8FAFC] tracking-[-0.02em] mb-6">
              Have a problem worth solving?
            </h2>
            <p className="text-lg text-[#94A3B8] font-light max-w-2xl mb-10 leading-relaxed">
              We partner with ambitious teams to design and engineer production-grade AI systems, software platforms, and digital products.
            </p>
            <Link 
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold tracking-[0.15em] text-white uppercase transition-all duration-300 bg-[#1677FF] hover:bg-[#38BDF8] rounded-full shadow-[0_0_20px_rgba(22,119,255,0.2)] hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#030712]"
            >
              START A PROJECT
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
