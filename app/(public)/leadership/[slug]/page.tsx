import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const m = await prisma.leadership.findUnique({ where: { slug: (await params).slug } }).catch(() => null);
  if (!m) return { title: "Not Found" };
  return { title: m.name, description: m.shortBio };
}

export default async function LeadershipProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const m = await prisma.leadership.findUnique({ where: { slug: (await params).slug } }).catch(() => null);
  if (!m || !m.isActive) notFound();

  return (
    <>
      <style>{`
        .prof-page { padding-top: calc(var(--nav-height, 80px) + 3.5rem); padding-bottom: 6rem; padding-inline: clamp(1.25rem, 5vw, 4rem); min-height: 100vh; background: var(--color-void, #030712); }
        .prof-inner { max-width: 1100px; margin: 0 auto; }
        .prof-back { display: inline-flex; align-items: center; gap: 0.5rem; color: #64748B; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.1em; font-family: var(--font-mono, monospace); margin-bottom: 3rem; transition: color 0.2s; }
        .prof-back:hover { color: #3B82F6; }
        @media (max-width: 768px) {
          .prof-page { padding-top: calc(var(--nav-height, 80px) + 1.5rem); padding-bottom: 3.5rem; padding-inline: 1rem; }
          .prof-grid { grid-template-columns: 1fr; gap: 1.75rem; }
          .prof-photo { aspect-ratio: 1/1; max-height: 240px; }
          .prof-name { font-size: clamp(1.6rem, 5vw, 2.5rem); }
          .prof-back { margin-bottom: 1.5rem; }
          .prof-short-bio { font-size: 1rem; line-height: 1.6; }
        }
        .prof-photo { width: 100%; aspect-ratio: 3/4; max-height: 400px; border-radius: 10px; overflow: hidden; background: linear-gradient(135deg, #0A1628, #07152F); border: 1px solid rgba(30,58,138,0.4); display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; }
        .prof-photo img { width: 100%; height: 100%; object-fit: cover; }
        .prof-pid { font-family: var(--font-mono, monospace); font-size: 0.65rem; color: #64748B; letter-spacing: 0.15em; margin-bottom: 1rem; }
        .prof-social { display: flex; flex-direction: column; gap: 0.5rem; }
        .prof-social-link { display: inline-flex; align-items: center; gap: 0.5rem; color: #64748B; text-decoration: none; font-size: 0.85rem; transition: color 0.2s; padding: 0.5rem 0.75rem; border: 1px solid rgba(30,58,138,0.3); border-radius: 6px; }
        .prof-social-link:hover { color: #3B82F6; border-color: rgba(37,99,235,0.5); }
        .prof-brand { font-family: var(--font-mono, monospace); font-size: 0.6rem; color: rgba(59,130,246,0.6); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 0.75rem; }
        .prof-name { font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 700; letter-spacing: -0.035em; color: #F8FAFC; line-height: 1; margin-bottom: 0.75rem; }
        .prof-pos { font-family: var(--font-mono, monospace); font-size: 0.8rem; color: #3B82F6; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 0.375rem; }
        .prof-dept { font-size: 0.875rem; color: #64748B; margin-bottom: 2.5rem; }
        .prof-divider { height: 1px; background: linear-gradient(to right, rgba(30,58,138,0.4), transparent); margin: 2rem 0; }
        .prof-section-label { font-family: var(--font-mono, monospace); font-size: 0.62rem; color: #64748B; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 0.875rem; }
        .prof-short-bio { font-size: 1.175rem; color: #A8B3C7; line-height: 1.75; }
        .prof-full-bio { font-size: 1rem; color: #8899B0; line-height: 1.85; white-space: pre-wrap; }
        .prof-meta { display: flex; flex-wrap: wrap; gap: 1.5rem; }
        .prof-meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
        .prof-meta-key { font-family: var(--font-mono, monospace); font-size: 0.62rem; color: #64748B; letter-spacing: 0.1em; text-transform: uppercase; }
        .prof-meta-val { font-size: 0.9rem; color: #A8B3C7; }
      `}</style>
      <div className="prof-page">
        <div className="prof-inner">
          <Link href="/leadership" className="prof-back">← BACK TO LEADERSHIP</Link>
          <div className="prof-grid">
            <div>
              <div className="prof-photo">
                {m.photo ? <img src={m.photo} alt={m.name} /> : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(59,130,246,0.25)" strokeWidth="1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                )}
              </div>
              <p className="prof-pid">{m.publicId}</p>
              <div className="prof-social">
                {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="prof-social-link"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>LinkedIn</a>}
                {m.website && <a href={m.website} target="_blank" rel="noopener noreferrer" className="prof-social-link"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>Website</a>}
                {m.email && <a href={"mailto:" + m.email} className="prof-social-link"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Email</a>}
              </div>
            </div>
            <div>
              <p className="prof-brand">QUANTUM AI</p>
              <h1 className="prof-name">{m.name}</h1>
              <p className="prof-pos">{m.position.replace("_", " ")}</p>
              {(m.department || m.location) && <p className="prof-dept">{[m.department, m.location].filter(Boolean).join(" · ")}</p>}
              <div className="prof-divider" />
              <p className="prof-section-label">OVERVIEW</p>
              <p className="prof-short-bio">{m.shortBio}</p>
              {m.fullBio && (<><div className="prof-divider" /><p className="prof-section-label">BIOGRAPHY</p><p className="prof-full-bio">{m.fullBio}</p></>)}
              {(m.location || m.email || m.department) && (
                <><div className="prof-divider" /><p className="prof-section-label">DETAILS</p>
                <div className="prof-meta">
                  {m.location && <div className="prof-meta-item"><span className="prof-meta-key">Location</span><span className="prof-meta-val">{m.location}</span></div>}
                  {m.department && <div className="prof-meta-item"><span className="prof-meta-key">Department</span><span className="prof-meta-val">{m.department}</span></div>}
                  {m.email && <div className="prof-meta-item"><span className="prof-meta-key">Email</span><a href={"mailto:" + m.email} style={{ color: "#3B82F6", textDecoration: "none", fontSize: "0.9rem" }}>{m.email}</a></div>}
                </div></>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}