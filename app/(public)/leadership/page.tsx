import prisma from "@/lib/db";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Leadership & Engineering Team — Quantum AI",
  description: "Meet the founders, executives, and software engineers directing the systems, technology, and strategic vision of Quantum AI.",
  path: "/leadership",
});

interface LeaderItem {
  id: string;
  publicId?: string | null;
  slug: string;
  name: string;
  position: string;
  department?: string | null;
  shortBio: string;
  fullBio?: string | null;
  photo?: string | null;
  linkedin?: string | null;
  email?: string | null;
  website?: string | null;
  location?: string | null;
  displayOrder?: number;
}

const FALLBACK_MEMBERS: LeaderItem[] = [
  {
    id: "f-fahad",
    publicId: "QA-001",
    slug: "fahad-khan",
    name: "Fahad Khan",
    position: "Co-Founder & Executive Chairman",
    department: "Executive Leadership",
    shortBio: "Co-Founder and Executive Chairman of Quantum AI, guiding strategic direction, engineering vision, and long-term organizational growth.",
    photo: "https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787236158396-98299.jpg",
    linkedin: "https://www.linkedin.com/in/fahad-khan-650a783a4/",
    location: "Peshawar",
    displayOrder: 1,
  },
  {
    id: "f-fawadullah",
    publicId: "QA-002",
    slug: "fawadullah-imraj",
    name: "Fawadullah Imraj",
    position: "Co-Founder & Chief Executive Officer",
    department: "Executive Leadership",
    shortBio: "Co-Founder and CEO of Quantum AI, directing AI-powered software systems, workflow automation architectures, and enterprise digital solutions.",
    photo: "https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787071914024-Screenshot_20260818-215108_WhatsApp.jpg",
    linkedin: "https://www.linkedin.com/in/fawadullahimraj/",
    location: "Pakistan",
    displayOrder: 2,
  },
  {
    id: "f-abdullah",
    publicId: "QA-003",
    slug: "abdullah-mahmook",
    name: "Abdullah Mahmood",
    position: "Lead Software Engineer",
    department: "Software Development",
    shortBio: "Software developer focused on building reliable, modern web applications, scalable backends, and full-stack operational platforms.",
    photo: "https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787054190871-Screenshot_2026-08-18_165611.png",
    linkedin: "https://www.linkedin.com/in/abdullah-mahmood-323050346/",
    location: "Peshawar",
    displayOrder: 3,
  },
  {
    id: "f-anisa",
    publicId: "QA-004",
    slug: "hafizah-anisa-safdar",
    name: "Hafizah Anisa Safdar",
    position: "Business Development Partner",
    department: "Business Development",
    shortBio: "Business Development Partner at Quantum AI, building client relationships, strategic partnerships, and enterprise market expansion.",
    photo: "https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787235947568-WhatsApp_Image_2026-08-20_at_7.09.26_PM.jpeg",
    linkedin: "https://www.linkedin.com/in/hafizah-anisa-safdar-89a00338b",
    location: "Pk/Remote",
    displayOrder: 4,
  },
  {
    id: "f-waqas",
    publicId: "QA-005",
    slug: "waqas-ali-khan",
    name: "Waqas Ali Khan",
    position: "Digital Marketing & Strategic Growth Partner",
    department: "Business Development",
    shortBio: "Digital marketing and business development professional focused on strategic partnerships, digital reach, and sustainable business growth.",
    photo: "https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787227215810-Screenshot_2026-08-20_170002.png",
    linkedin: "https://www.linkedin.com/in/waqas-ali-khan-278b1b414/",
    location: "Peshawar",
    displayOrder: 5,
  },
];

export default async function LeadershipPage() {
  const dbMembers = await prisma.leadership.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  }).catch(() => []);

  const members: LeaderItem[] = dbMembers && dbMembers.length > 0 ? dbMembers : FALLBACK_MEMBERS;

  // ─── STRICT HIERARCHY LOGIC: EXECUTIVE CHAIRMAN + CEO AS TWO EQUAL PILLARS (CHAIRMAN FIRST) ───
  const isChairman = (m: LeaderItem) =>
    m.slug.includes("fahad") ||
    m.position.toLowerCase().includes("chairman") ||
    m.position.toLowerCase().includes("chairperson");

  const isCeo = (m: LeaderItem) =>
    m.slug.includes("fawad") ||
    m.position.toLowerCase().includes("ceo") ||
    m.position.toLowerCase().includes("chief executive");

  const chairman = members.find(isChairman);
  const ceo = members.find(isCeo);

  // Collect the principal duo (Executive Chairman first, CEO second)
  const principalLeaders: LeaderItem[] = [];
  if (chairman) principalLeaders.push(chairman);
  if (ceo && ceo.id !== chairman?.id) principalLeaders.push(ceo);

  // If neither matches by string, take first two as principal
  if (principalLeaders.length === 0 && members.length >= 2) {
    principalLeaders.push(members[0], members[1]);
  }

  const principalIds = new Set(principalLeaders.map((p) => p.id));

  // Executive Team (the remaining leaders)
  const executiveTeam = members.filter((m) => !principalIds.has(m.id));

  return (
    <div className="ldr-page">
      <style>{`
        .ldr-page {
          padding-top: calc(var(--nav-height, 72px) + 2.5rem);
          padding-bottom: 5rem;
          padding-inline: var(--container-px, clamp(1.25rem, 5vw, 4rem));
          min-height: 100vh;
          background: var(--color-void, #030712);
          position: relative;
          color: #F8FAFC;
        }
        .ldr-container {
          max-width: 1160px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* ─── Page Hero ─── */
        .ldr-hero {
          margin-bottom: clamp(2.5rem, 5vw, 4rem);
          border-bottom: 1px solid rgba(22, 119, 255, 0.14);
          padding-bottom: clamp(2rem, 4vw, 3rem);
        }
        .ldr-eyebrow {
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          letter-spacing: 0.25em;
          color: #1677FF;
          text-transform: uppercase;
          margin-bottom: 0.65rem;
          font-weight: 600;
        }
        .ldr-h1 {
          font-size: clamp(2.5rem, 5vw, 4.25rem);
          font-weight: 700;
          line-height: 1.02;
          letter-spacing: -0.035em;
          color: #F8FAFC;
          text-transform: uppercase;
          margin: 0 0 1rem 0;
          max-width: 900px;
        }
        .ldr-lead {
          font-size: clamp(0.9rem, 1.1vw, 1.05rem);
          color: #94A3B8;
          max-width: 680px;
          line-height: 1.65;
          margin: 0;
          font-weight: 300;
        }

        /* ─── Section Headers ─── */
        .ldr-section-header {
          margin-bottom: clamp(1.75rem, 3.5vw, 2.5rem);
        }
        .ldr-section-tag {
          font-family: var(--font-mono, monospace);
          font-size: 0.68rem;
          color: #1677FF;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 0.35rem;
          font-weight: 600;
        }
        .ldr-section-title {
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 700;
          letter-spacing: -0.025em;
          color: #F8FAFC;
          text-transform: uppercase;
          margin: 0 0 0.5rem 0;
        }
        .ldr-section-intro {
          font-size: clamp(0.88rem, 1.25vw, 0.98rem);
          color: #94A3B8;
          max-width: 640px;
          line-height: 1.6;
          margin: 0;
          font-weight: 300;
        }

        /* ─── CEO + CHAIRMAN TWO EQUAL PILLARS GRID ─── */
        .ldr-principals-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: clamp(1.25rem, 3vw, 2rem);
          margin-bottom: clamp(3.5rem, 6vw, 5rem);
        }

        /* ─── Executive Team Grid ─── */
        .ldr-exec-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: clamp(1.15rem, 2.5vw, 1.75rem);
          margin-bottom: clamp(3.5rem, 6vw, 5rem);
        }

        /* ─── Premium Executive Card ─── */
        .exec-card {
          background-color: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.16);
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s, background-color 0.25s;
          box-sizing: border-box;
          position: relative;
          outline: none;
        }
        .exec-card:hover {
          background-color: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.45);
          transform: translateY(-3px);
          box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.25);
        }
        .exec-card:focus-visible {
          border-color: #38BDF8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4);
        }

        /* Portrait Photo Container (4:5 Aspect Ratio) */
        .exec-photo-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 4.8;
          background: linear-gradient(180deg, #07152F 0%, #030A17 100%);
          overflow: hidden;
          border-bottom: 1px solid rgba(22, 119, 255, 0.14);
        }
        .exec-photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 15%;
          transition: transform 0.4s ease;
        }
        /* Featured Executive (CEO & Chairman) Natural Portrait Framing */
        .principal-photo-wrapper {
          aspect-ratio: 1 / 1 !important;
          background: radial-gradient(circle at center, #0B224E 0%, #030A17 100%) !important;
        }
        .principal-photo-img {
          object-fit: cover !important;
          object-position: center top !important;
        }
        .exec-card:hover .exec-photo-img {
          transform: scale(1.03);
        }
        .exec-photo-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: rgba(56, 189, 248, 0.4);
          font-family: var(--font-mono, monospace);
          font-size: 0.8rem;
        }

        /* Top Corner Badge on Photo */
        .exec-corner-badge {
          position: absolute;
          top: 0.85rem;
          left: 0.85rem;
          font-family: var(--font-mono, monospace);
          font-size: 0.62rem;
          letter-spacing: 0.15em;
          color: #38BDF8;
          background: rgba(3, 7, 18, 0.75);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(56, 189, 248, 0.3);
          padding: 0.25rem 0.55rem;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 600;
          z-index: 2;
        }

        /* Card Information Body */
        .exec-body {
          padding: 1.35rem 1.45rem;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          gap: 0.45rem;
        }
        .exec-name {
          font-size: clamp(1.2rem, 2.2vw, 1.45rem);
          font-weight: 600;
          color: #F8FAFC;
          letter-spacing: -0.015em;
          margin: 0;
          line-height: 1.25;
        }
        .exec-position {
          font-family: var(--font-mono, monospace);
          font-size: 0.68rem;
          color: #38BDF8;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .exec-bio {
          font-size: 0.86rem;
          color: #94A3B8;
          line-height: 1.6;
          margin: 0;
          font-weight: 300;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Card Footer Action */
        .exec-footer {
          padding: 0.85rem 1.25rem;
          border-top: 1px solid rgba(22, 119, 255, 0.12);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono, monospace);
          background: rgba(3, 7, 18, 0.35);
          margin-top: auto;
          box-sizing: border-box;
          min-width: 0;
          overflow: hidden;
        }
        .exec-social-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          color: #64748B;
          text-decoration: none;
          transition: color 0.2s;
          flex-shrink: 0;
          min-width: 0;
        }
        .exec-social-link svg {
          flex-shrink: 0;
        }
        .exec-social-link:hover {
          color: #38BDF8;
        }
        .exec-action-text {
          font-size: 0.72rem;
          color: #1677FF;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          transition: color 0.2s, transform 0.2s;
          margin-left: auto;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .exec-action-short {
          display: none;
        }
        .exec-card:hover .exec-action-text {
          color: #38BDF8;
          transform: translateX(3px);
        }

        /* ─── Philosophy Section ─── */
        .ldr-philosophy-box {
          background: rgba(6, 21, 43, 0.5);
          border: 1px solid rgba(22, 119, 255, 0.18);
          border-radius: 12px;
          padding: clamp(2rem, 4vw, 3rem);
          margin-bottom: clamp(3.5rem, 6vw, 5rem);
          position: relative;
          overflow: hidden;
        }
        .ldr-philosophy-box::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #1677FF 0%, #38BDF8 100%);
        }
        .ldr-philosophy-quote {
          font-size: clamp(1.35rem, 3vw, 2rem);
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.3;
          color: #F8FAFC;
          margin: 0 0 1rem 0;
        }
        .ldr-philosophy-desc {
          font-size: 0.95rem;
          color: #94A3B8;
          line-height: 1.7;
          max-width: 800px;
          margin: 0;
          font-weight: 300;
        }

        /* ─── Bottom CTA ─── */
        .ldr-bottom-cta {
          border-top: 1px solid rgba(22, 119, 255, 0.14);
          padding-top: 3.5rem;
          text-align: center;
        }
        .ldr-cta-btn {
          display: inline-block;
          padding: 0.85rem 2rem;
          background-color: #1677FF;
          color: #fff;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-family: var(--font-mono, monospace);
          letter-spacing: 0.08em;
          font-size: 0.82rem;
          transition: background-color 0.2s, transform 0.2s;
        }
        .ldr-cta-btn:hover {
          background-color: #2563EB;
          transform: translateY(-1px);
        }
        .ldr-cta-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px #38BDF8;
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .ldr-principals-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1rem;
          }
          .ldr-exec-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1rem;
          }
        }
        @media (max-width: 680px) {
          .ldr-page {
            padding-top: calc(var(--nav-height, 72px) + 1.25rem) !important;
            padding-bottom: 3.5rem !important;
            padding-inline: clamp(0.65rem, 3vw, 1.25rem) !important;
          }
          .ldr-h1 {
            font-size: clamp(1.85rem, 6.5vw, 2.75rem) !important;
            margin-bottom: 0.75rem !important;
          }
          .ldr-lead {
            font-size: 0.86rem !important;
            line-height: 1.5 !important;
          }
          .ldr-section-header {
            margin-bottom: 1.5rem !important;
          }
          .ldr-section-title {
            font-size: clamp(1.25rem, 4.5vw, 1.65rem) !important;
          }
          .ldr-section-intro {
            font-size: 0.82rem !important;
            line-height: 1.5 !important;
          }
          .ldr-principals-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: clamp(0.45rem, 2.5vw, 0.75rem) !important;
            margin-bottom: 2.5rem !important;
          }
          .ldr-exec-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: clamp(0.45rem, 2.5vw, 0.75rem) !important;
            margin-bottom: 2.5rem !important;
          }
          .ldr-hero {
            margin-bottom: 2rem !important;
            padding-bottom: 1.5rem !important;
          }
          .exec-card {
            border-radius: 8px !important;
            min-width: 0 !important;
          }
          .exec-photo-wrapper {
            aspect-ratio: 1 / 1 !important;
          }
          .exec-corner-badge {
            font-size: 0.5rem !important;
            padding: 0.12rem 0.35rem !important;
            top: 0.4rem !important;
            left: 0.4rem !important;
          }
          .exec-body {
            padding: 0.55rem 0.65rem !important;
            gap: 0.2rem !important;
          }
          .exec-name {
            font-size: clamp(0.82rem, 3.2vw, 0.95rem) !important;
            line-height: 1.2 !important;
            word-break: break-word !important;
          }
          .exec-position {
            font-size: 0.58rem !important;
            letter-spacing: 0.04em !important;
            margin-bottom: 0.1rem !important;
          }
          .exec-bio {
            font-size: 0.7rem !important;
            line-height: 1.35 !important;
            -webkit-line-clamp: 2 !important;
          }
          .exec-footer {
            padding: 0.45rem 0.55rem !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            gap: 0.25rem !important;
            width: 100% !important;
            box-sizing: border-box !important;
            min-width: 0 !important;
            overflow: hidden !important;
            background: rgba(3, 7, 18, 0.4) !important;
          }
          .exec-social-link {
            font-size: 0.62rem !important;
            color: #38BDF8 !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 0.2rem !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .exec-social-link svg {
            width: 11px !important;
            height: 11px !important;
          }
          .exec-action-text {
            font-size: 0.62rem !important;
            letter-spacing: 0.04em !important;
            color: #1677FF !important;
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 0.15rem !important;
            flex-shrink: 0 !important;
            margin-left: auto !important;
          }
          .exec-action-full {
            display: none !important;
          }
          .exec-action-short {
            display: inline !important;
          }
          .ldr-philosophy-box {
            padding: clamp(1.25rem, 4vw, 2rem) !important;
            margin-bottom: 2.5rem !important;
          }
          .ldr-philosophy-quote {
            font-size: clamp(1.15rem, 4vw, 1.5rem) !important;
          }
          .ldr-philosophy-desc {
            font-size: 0.85rem !important;
            line-height: 1.55 !important;
          }
          .ldr-bottom-cta {
            padding-top: 2.5rem !important;
          }
          .ldr-cta-btn {
            width: min(100%, 280px) !important;
            padding: 0.75rem 1.25rem !important;
            font-size: 0.75rem !important;
          }
        }
        @media (max-width: 360px) {
          .ldr-page {
            padding-inline: 0.5rem !important;
          }
          .ldr-principals-grid,
          .ldr-exec-grid {
            gap: 0.35rem !important;
          }
          .exec-body {
            padding: 0.45rem 0.5rem !important;
          }
          .exec-name {
            font-size: 0.78rem !important;
          }
          .exec-position {
            font-size: 0.54rem !important;
          }
          .exec-bio {
            font-size: 0.65rem !important;
          }
          .exec-footer {
            padding: 0.35rem 0.45rem !important;
          }
          .exec-social-link {
            font-size: 0.56rem !important;
          }
          .exec-social-link svg {
            width: 10px !important;
            height: 10px !important;
          }
          .exec-action-text {
            font-size: 0.56rem !important;
          }
        }
      `}</style>

      <div className="ldr-container">
        {/* ─── 1. PAGE HERO ─── */}
        <section className="ldr-hero">
          <div className="ldr-eyebrow">[01 — LEADERSHIP &amp; TEAM]</div>
          <h1 className="ldr-h1">
            The Team Behind Quantum AI.
          </h1>
          <p className="ldr-lead">
            Engineering leads, software architects, and business strategists combining artificial intelligence, software engineering, business understanding, and product development to build practical systems for real-world impact.
          </p>
        </section>

        {/* ─── 2. PRIMARY LEADERSHIP: CEO + CHAIRMAN (FOUNDERS / EXECUTIVE LEADERSHIP) ─── */}
        <section style={{ marginBottom: "clamp(3.5rem, 6vw, 5rem)" }}>
          <div className="ldr-section-header">
            <div className="ldr-section-tag">SYS.01 // EXECUTIVE LEADERSHIP</div>
            <h2 className="ldr-section-title">FOUNDERS &amp; EXECUTIVE LEADERSHIP.</h2>
            <p className="ldr-section-intro">
              Strategic and technical direction, executive governance, and long-term architectural vision for Quantum AI.
            </p>
          </div>

          <div className="ldr-principals-grid">
            {principalLeaders.map((leader, idx) => (
              <Link key={leader.id} href={`/leadership/${leader.slug}`} className="exec-card principal-card">
                <div className="exec-photo-wrapper principal-photo-wrapper">
                  <div className="exec-corner-badge">
                    {leader.publicId || (leader.position.toLowerCase().includes("chairman") || leader.slug.includes("fahad") ? "QA-001" : "QA-002")} // {leader.position.toLowerCase().includes("chairman")
                      ? "EXECUTIVE CHAIRMAN"
                      : "CHIEF EXECUTIVE OFFICER"}
                  </div>
                  {leader.photo ? (
                    <img
                      src={leader.photo}
                      alt={leader.name}
                      className="exec-photo-img principal-photo-img"
                    />
                  ) : (
                    <div className="exec-photo-fallback">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>QUANTUM AI</span>
                    </div>
                  )}
                </div>

                <div className="exec-body">
                  <div className="exec-position">
                    {leader.position.replace(/_/g, " ").toUpperCase()}
                  </div>
                  <h3 className="exec-name">{leader.name}</h3>
                  <p className="exec-bio">{leader.shortBio}</p>
                </div>

                <div className="exec-footer">
                  {leader.linkedin ? (
                    <span className="exec-social-link">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      <span>LinkedIn</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.68rem", color: "#64748B" }}>QUANTUM AI</span>
                  )}
                  <span className="exec-action-text">
                    <span className="exec-action-full">VIEW PROFILE</span>
                    <span className="exec-action-short">PROFILE</span>
                    <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── 3. CORE TEAM ─── */}
        {executiveTeam.length > 0 && (
          <section style={{ marginBottom: "clamp(3.5rem, 6vw, 5rem)" }}>
            <div className="ldr-section-header">
              <div className="ldr-section-tag">SYS.02 // CORE TEAM</div>
              <h2 className="ldr-section-title">CORE TEAM.</h2>
              <p className="ldr-section-intro">
                Software development, business development, and growth specialists driving execution across Quantum AI platforms and partner initiatives.
              </p>
            </div>

            <div className="ldr-exec-grid">
              {executiveTeam.map((member, idx) => (
                <Link key={member.id} href={`/leadership/${member.slug}`} className="exec-card">
                  <div className="exec-photo-wrapper">
                    {member.department && (
                      <div className="exec-corner-badge">
                        {member.department.trim()}
                      </div>
                    )}
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="exec-photo-img"
                      />
                    ) : (
                      <div className="exec-photo-fallback">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>QUANTUM AI</span>
                      </div>
                    )}
                  </div>

                  <div className="exec-body">
                    <div className="exec-position">
                      {member.position.replace(/_/g, " ").toUpperCase()}
                    </div>
                    <h3 className="exec-name">{member.name}</h3>
                    <p className="exec-bio">{member.shortBio}</p>
                  </div>

                  <div className="exec-footer">
                    {member.linkedin ? (
                      <span className="exec-social-link">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        <span>LinkedIn</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.68rem", color: "#64748B" }}>QUANTUM AI</span>
                    )}
                    <span className="exec-action-text">
                      <span className="exec-action-full">VIEW PROFILE</span>
                      <span className="exec-action-short">PROFILE</span>
                      <span>→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── 4. LEADERSHIP PHILOSOPHY ─── */}
        <section className="ldr-philosophy-box">
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.68rem", color: "#38BDF8", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 600 }}>
            CORE PRINCIPLE
          </div>
          <h2 className="ldr-philosophy-quote">
            Technology is built by people. Intelligence is shaped by purpose.
          </h2>
          <p className="ldr-philosophy-desc">
            We believe deep technical precision and human-centric engineering must advance hand in hand. Every neural model, operational portal, and automated pipeline we deploy is engineered with rigorous attention to detail, long-term reliability, and genuine real-world utility for the organizations we serve.
          </p>
        </section>

        {/* ─── 5. FINAL CALL TO ACTION ─── */}
        <section className="ldr-bottom-cta">
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.68rem", color: "#1677FF", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 600 }}>
            COLLABORATION & INQUIRIES
          </div>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#F8FAFC", fontWeight: 700, textTransform: "uppercase", margin: "0 0 0.5rem 0", letterSpacing: "-0.02em" }}>
            LET&apos;S BUILD WHAT&apos;S NEXT.
          </h2>
          <p style={{ color: "#94A3B8", marginBottom: "1.75rem", maxWidth: 520, margin: "0 auto 1.75rem", fontSize: "0.92rem", lineHeight: 1.6, fontWeight: 300 }}>
            Have an idea, a challenge, or a system that needs intelligent technology? Connect directly with our leadership and engineering team.
          </p>
          <Link href="/contact" className="ldr-cta-btn">
            START A CONVERSATION →
          </Link>
        </section>
      </div>
    </div>
  );
}