import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

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
  github?: string | null;
  email?: string | null;
  website?: string | null;
  location?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

const FALLBACK_MEMBERS_MAP: Record<string, LeaderItem> = {
  "muhammad-murtaza": {
    id: "f-murtaza",
    publicId: "QA-001",
    slug: "muhammad-murtaza",
    name: "Muhammad Murtaza",
    position: "Co-Founder & Chief Executive Officer",
    department: "Executive Leadership",
    shortBio: "Co-Founder and CEO of Quantum AI, directing AI-powered software systems, workflow automation architectures, and enterprise digital solutions.",
    fullBio: "Muhammad Murtaza is the Founder and CEO of Quantum AI. He focuses on building practical software powered by AI for education, businesses, and enterprise organizations. His engineering work covers neural systems, workflow automation pipelines, high-concurrency web applications, and custom software architectures engineered to eliminate operational friction and solve real-world problems.",
    photo: "https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787071914024-Screenshot_20260818-215108_WhatsApp.jpg",
    linkedin: "https://www.linkedin.com/company/quantumai",
    github: "https://github.com/quantumai",
    email: "contact@quantumai.dev",
    location: "Global / Hybrid",
    displayOrder: 1,
    isActive: true,
  },
  "fahad-khan": {
    id: "f-fahad",
    publicId: "QA-002",
    slug: "fahad-khan",
    name: "Fahad Khan",
    position: "Co-Founder & Executive Chairman",
    department: "Executive Leadership",
    shortBio: "Co-Founder and Executive Chairman of Quantum AI, guiding strategic direction, engineering vision, and long-term organizational growth.",
    fullBio: "Fahad Khan is the Executive Chairman of Quantum AI. He contributes to the company's strategic direction, technical vision, major decisions, and long-term growth. With a background in mechatronics engineering and AI systems, he brings deep technical knowledge and leadership to Quantum AI's system architecture, research direction, and institutional governance.",
    photo: "https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787236158396-98299.jpg",
    linkedin: "https://www.linkedin.com/in/fahad-khan-650a783a4/",
    github: "https://github.com",
    email: "fahad.off.707@gmail.com",
    location: "Peshawar",
    displayOrder: 2,
    isActive: true,
  },
  "abdullah-mahmook": {
    id: "f-abdullah",
    publicId: "QA-003",
    slug: "abdullah-mahmook",
    name: "Abdullah Mahmood",
    position: "Lead Software Engineer",
    department: "Software Development",
    shortBio: "Software developer focused on building reliable, modern web applications, scalable backends, and full-stack operational platforms.",
    fullBio: "Abdullah is a software developer working on the design, development, testing, and improvement of software applications. He contributes to frontend and backend development and helps turn ideas into practical digital products for Quantum AI.",
    photo: "https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787054190871-Screenshot_2026-08-18_165611.png",
    linkedin: "https://www.linkedin.com/in/abdullah-mahmood-323050346/",
    email: "Abdullahmahmood@gmail.com",
    location: "Peshawar",
    displayOrder: 3,
    isActive: true,
  },
  "hafizah-anisa-safdar": {
    id: "f-anisa",
    publicId: "QA-004",
    slug: "hafizah-anisa-safdar",
    name: "Hafizah Anisa Safdar",
    position: "Business Development Partner",
    department: "Business Development",
    shortBio: "Business Development Partner at Quantum AI, building client relationships, strategic partnerships, and enterprise market expansion.",
    fullBio: "Anisa Safdar is a Business Development Partner at Quantum AI, dedicated to expanding the company's reach and connecting businesses with innovative AI and digital solutions. With strong communication and marketing skills, she works to identify new opportunities, build lasting client relationships, and represent Quantum AI with professionalism and integrity.",
    photo: "https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787235947568-WhatsApp_Image_2026-08-20_at_7.09.26_PM.jpeg",
    linkedin: "https://www.linkedin.com/in/hafizah-anisa-safdar-89a00338b",
    email: "risingstarstar21@gmail.com",
    location: "Pk/Remote",
    displayOrder: 4,
    isActive: true,
  },
  "waqas-ali-khan": {
    id: "f-waqas",
    publicId: "QA-005",
    slug: "waqas-ali-khan",
    name: "Waqas Ali Khan",
    position: "Digital Marketing & Strategic Growth Partner",
    department: "Business Development",
    shortBio: "Digital marketing and business development professional focused on strategic partnerships, digital reach, and sustainable business growth.",
    fullBio: "Waqas Ali Khan is a Digital Marketing & Business Development Partner focused on digital growth, strategic partnerships, client acquisition, and business development. He works on strengthening the company's digital presence, identifying new opportunities, developing partnerships, and creating strategies that support long-term business growth.",
    photo: "https://7495fnfcayak83c2.public.blob.vercel-storage.com/1787227215810-Screenshot_2026-08-20_170002.png",
    linkedin: "https://www.linkedin.com/in/waqas-ali-khan-278b1b414/",
    email: "waqasalikhan683@gmail.com",
    location: "Peshawar",
    displayOrder: 5,
    isActive: true,
  },
};

import { getMergedLeaders } from "@/lib/getMergedLeaders";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { dbMembers, appMembers } = await getMergedLeaders();
  const allMembers = [...dbMembers, ...appMembers];
  const dbMember = allMembers.find((m) => m.slug === slug);
  const m = dbMember || FALLBACK_MEMBERS_MAP[slug];

  if (!m) return { title: "Profile Not Found | Quantum AI" };

  return createPageMetadata({
    title: `${m.name} (${m.position}) — Leadership | Quantum AI`,
    description: m.shortBio || `${m.name} is ${m.position} at Quantum AI.`,
    path: `/leadership/${slug}`,
    image: m.photo || undefined,
  });
}

export async function generateStaticParams() {
  const { dbMembers, appMembers } = await getMergedLeaders();
  const dbSlugs = [...dbMembers, ...appMembers].map((m) => ({ slug: m.slug }));
  const fallbackSlugs = Object.keys(FALLBACK_MEMBERS_MAP).map((slug) => ({ slug }));
  return dbSlugs.length > 0 ? dbSlugs : fallbackSlugs;
}

export default async function LeadershipProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { dbMembers, appMembers } = await getMergedLeaders();
  const allMembers = [...dbMembers, ...appMembers];
  const dbMember = allMembers.find((m) => m.slug === slug);
  const m = dbMember || FALLBACK_MEMBERS_MAP[slug];

  if (!m || m.isActive === false) {
    notFound();
  }

  return (
    <div className="prof-page">
      <style>{`
        .prof-page {
          padding-top: calc(var(--nav-height, 72px) + 2rem);
          padding-bottom: 5rem;
          padding-inline: var(--container-px, clamp(1.25rem, 5vw, 4rem));
          min-height: 100vh;
          background: var(--color-void, #030712);
          color: #F8FAFC;
        }
        .prof-inner {
          max-width: 1060px;
          margin: 0 auto;
        }
        .prof-back {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #38BDF8;
          text-decoration: none;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          font-family: var(--font-mono, monospace);
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 2rem;
          transition: color 0.2s, transform 0.2s;
        }
        .prof-back:hover {
          color: #1677FF;
          transform: translateX(-2px);
        }
        .prof-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: start;
        }

        /* Portrait Container */
        .prof-photo-box {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 4.8;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(180deg, #07152F 0%, #030A17 100%);
          border: 1px solid rgba(22, 119, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .prof-photo-box.is-principal-profile {
          aspect-ratio: 1 / 1 !important;
          background: radial-gradient(circle at center, #0B224E 0%, #030A17 100%) !important;
        }
        .prof-photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 15%;
        }
        .prof-photo-img.is-principal-profile {
          object-fit: cover !important;
          object-position: center top !important;
        }

        .prof-social-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .prof-social-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #94A3B8;
          text-decoration: none;
          font-size: 0.78rem;
          font-family: var(--font-mono, monospace);
          padding: 0.55rem 0.85rem;
          background: rgba(6, 21, 43, 0.6);
          border: 1px solid rgba(22, 119, 255, 0.18);
          border-radius: 6px;
          transition: all 0.2s;
        }
        .prof-social-btn:hover {
          color: #38BDF8;
          background: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.4);
        }

        /* Right Content Area */
        .prof-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .prof-tag {
          font-family: var(--font-mono, monospace);
          font-size: 0.68rem;
          color: #1677FF;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .prof-name {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #F8FAFC;
          line-height: 1.1;
          margin: 0;
        }
        .prof-position {
          font-family: var(--font-mono, monospace);
          font-size: 0.8rem;
          color: #38BDF8;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 600;
          margin-top: 0.25rem;
        }
        .prof-dept-pill {
          display: inline-block;
          font-family: var(--font-mono, monospace);
          font-size: 0.68rem;
          color: #64748B;
          letter-spacing: 0.08em;
          margin-top: 0.35rem;
        }

        .prof-card-block {
          background: rgba(6, 21, 43, 0.55);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 10px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .prof-card-label {
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          color: #1677FF;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 600;
        }
        .prof-bio-text {
          font-size: 0.95rem;
          color: #CBD5E1;
          line-height: 1.75;
          margin: 0;
          font-weight: 300;
        }

        @media (max-width: 820px) {
          .prof-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .prof-photo-box {
            max-width: 280px;
          }
        }
      `}</style>

      <div className="prof-inner">
        {/* Navigation Breadcrumb */}
        <Link href="/leadership" className="prof-back">
          ← BACK TO LEADERSHIP
        </Link>

        <div className="prof-grid">
          {/* Left Column: Portrait & Connect */}
          <div>
            {(() => {
              const isPrincipal =
                m.position.toLowerCase().includes("ceo") ||
                m.position.toLowerCase().includes("chairman") ||
                m.position.toLowerCase().includes("chief executive") ||
                (m.department && m.department.toLowerCase().includes("executive"));

              return (
                <div className={`prof-photo-box ${isPrincipal ? 'is-principal-profile' : ''}`}>
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt={m.name}
                      className={`prof-photo-img ${isPrincipal ? 'is-principal-profile' : ''}`}
                    />
                  ) : (
                    <div style={{ color: "#38BDF8", fontFamily: "var(--font-mono, monospace)", fontSize: "0.85rem" }}>
                      QUANTUM AI
                    </div>
                  )}
                </div>
              );
            })()}

            {m.publicId && (
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.68rem", color: "#64748B", letterSpacing: "0.15em", marginBottom: "0.85rem" }}>
                ID // {m.publicId}
              </div>
            )}

            <div className="prof-social-list">
              {m.linkedin && (
                <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="prof-social-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn Profile ↗
                </a>
              )}
              {m.github && (
                <a
                  href={m.github.startsWith("http") ? m.github : `https://${m.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${m.name}'s GitHub profile`}
                  className="prof-social-btn"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  GitHub Profile ↗
                </a>
              )}
              {m.email && (
                <a href={`mailto:${m.email}`} className="prof-social-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  {m.email}
                </a>
              )}
              {m.website && (
                <a href={m.website.startsWith("http") ? m.website : `https://${m.website}`} target="_blank" rel="noopener noreferrer" className="prof-social-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Personal Website ↗
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Details & Bio */}
          <div className="prof-main">
            <div>
              <div className="prof-tag">SYS.01 / LEADERSHIP PROFILE</div>
              <h1 className="prof-name">{m.name}</h1>
              <div className="prof-position">
                {m.position.replace(/_/g, " ").toUpperCase()}
              </div>
              {(m.department || m.location) && (
                <div className="prof-dept-pill">
                  {[m.department, m.location].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>

            {/* Executive Overview */}
            <div className="prof-card-block">
              <div className="prof-card-label">EXECUTIVE SUMMARY</div>
              <p className="prof-bio-text">{m.shortBio}</p>
            </div>

            {/* Full Biography */}
            {m.fullBio && (
              <div className="prof-card-block">
                <div className="prof-card-label">BIOGRAPHY & BACKGROUND</div>
                <p className="prof-bio-text" style={{ whiteSpace: "pre-line" }}>
                  {m.fullBio}
                </p>
              </div>
            )}

            {/* Institutional Link */}
            <div style={{ marginTop: "1rem" }}>
              <Link
                href="/contact"
                style={{
                  display: "inline-block",
                  padding: "0.75rem 1.75rem",
                  backgroundColor: "#1677FF",
                  color: "#fff",
                  borderRadius: 6,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.08em",
                  fontSize: "0.78rem",
                }}
              >
                CONNECT WITH LEADERSHIP →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}