import prisma from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leadership",
  description: "The people shaping the systems, products, and technology behind Quantum AI.",
};

export default async function LeadershipPage() {
  const members = await prisma.leadership.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  }).catch(() => []);

  return (
    <>
      <style>{`
        .ldr-page {
          padding-top: calc(var(--nav-height, 72px) + 2.5rem);
          padding-bottom: 5rem;
          padding-inline: clamp(1.25rem, 5vw, 4rem);
          min-height: 100vh;
          background: var(--color-void, #030712);
          position: relative;
        }
        .ldr-inner { max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }
        .ldr-eyebrow { font-family: var(--font-mono, monospace); font-size: 0.72rem; letter-spacing: 0.2em; color: #1677FF; text-transform: uppercase; margin-bottom: 0.75rem; }
        .ldr-h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 700; line-height: 1.05; letter-spacing: -0.035em; color: #F8FAFC; text-transform: uppercase; margin-bottom: 1rem; }
        .ldr-desc { font-size: clamp(0.88rem, 1.3vw, 0.98rem); color: #94A3B8; max-width: 560px; line-height: 1.6; margin-bottom: 2.5rem; }
        .ldr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; max-width: 900px; }
        @media (max-width: 768px) {
          .ldr-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        }
        @media (max-width: 540px) {
          .ldr-grid { grid-template-columns: repeat(2, 1fr); gap: 0.65rem; }
          .ldr-page { padding-inline: 0.75rem; padding-top: calc(var(--nav-height, 72px) + 1.5rem); }
          .id-card { border-radius: 8px; }
          .id-header { padding: 0.5rem 0.65rem; }
          .id-brand { font-size: 0.52rem; letter-spacing: 0.1em; }
          .id-pid { font-size: 0.52rem; }
          .id-photo { aspect-ratio: 1/1; max-height: 180px; }
          .id-body { padding: 0.65rem; }
          .id-name { font-size: 0.875rem; line-height: 1.2; margin-bottom: 0.2rem; }
          .id-pos { font-size: 0.58rem; margin-bottom: 0.4rem; }
          .id-bio { font-size: 0.72rem; line-height: 1.35; -webkit-line-clamp: 2; }
          .id-footer { padding: 0.45rem 0.65rem; }
          .id-link { font-size: 0.62rem; }
          .id-more { font-size: 0.55rem; letter-spacing: 0.04em; }
        }
        .id-card { background: var(--color-deep, #07152F); border: 1px solid rgba(30,58,138,0.45); border-radius: 10px; overflow: hidden; text-decoration: none; display: flex; flex-direction: column; transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s; position: relative; }
        .id-card::before { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at top left, rgba(79,70,229,0.07) 0%, transparent 60%); pointer-events: none; z-index: 0; }
        .id-card:hover { border-color: rgba(37,99,235,0.6); box-shadow: 0 0 0 1px rgba(37,99,235,0.2), 0 12px 40px rgba(0,0,0,0.5); transform: translateY(-4px); }
        .id-header { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; padding: 0.875rem 1.25rem; border-bottom: 1px solid rgba(30,58,138,0.3); }
        .id-brand { font-family: var(--font-mono, monospace); font-size: 0.6rem; letter-spacing: 0.18em; color: rgba(59,130,246,0.65); text-transform: uppercase; }
        .id-pid { font-family: var(--font-mono, monospace); font-size: 0.6rem; color: rgba(100,116,139,0.7); letter-spacing: 0.1em; }
        .id-photo { position: relative; z-index: 1; width: 100%; aspect-ratio: 4/3; background: linear-gradient(135deg, #0A1628 0%, #07152F 100%); overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .id-photo img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; }
        .id-photo-placeholder { width: 52px; height: 52px; border-radius: 6px; background: rgba(30,58,138,0.3); display: flex; align-items: center; justify-content: center; color: rgba(59,130,246,0.4); }
        .id-body { position: relative; z-index: 1; padding: 1.125rem 1.25rem; flex: 1; display: flex; flex-direction: column; }
        .id-name { font-size: clamp(0.9rem, 2.5vw, 1.05rem); font-weight: 600; color: #F8FAFC; margin-bottom: 0.2rem; letter-spacing: -0.01em; word-break: break-word; overflow-wrap: break-word; line-height: 1.3; }
        .id-pos { font-family: var(--font-mono, monospace); font-size: 0.65rem; color: #3B82F6; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.75rem; }
        .id-bio { font-size: 0.85rem; color: #A8B3C7; line-height: 1.6; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .id-footer { position: relative; z-index: 1; padding: 0.75rem 1.25rem; border-top: 1px solid rgba(30,58,138,0.2); display: flex; align-items: center; gap: 0.875rem; }
        .id-link { font-size: 0.72rem; color: #64748B; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem; transition: color 0.2s; }
        .id-link:hover { color: #3B82F6; }
        .id-more { margin-left: auto; font-size: 0.65rem; color: #64748B; font-family: var(--font-mono, monospace); letter-spacing: 0.08em; }
        .ldr-empty { text-align: center; padding: 5rem 2rem; color: #64748B; font-family: var(--font-mono, monospace); font-size: 0.875rem; letter-spacing: 0.1em; }
      `}</style>
      <div className="ldr-page">
        <div className="ldr-inner">
          <p className="ldr-eyebrow">[01 — LEADERSHIP]</p>
          <h1 className="ldr-h1">The People<br />Behind<br />Quantum AI.</h1>
          <p className="ldr-desc">The people shaping the systems, products, and technology behind Quantum AI.</p>
          <div className="ldr-grid">
            {members.length === 0 ? (
              <div className="ldr-empty" style={{ textAlign: 'center', padding: '5rem 2rem', color: '#475569', gridColumn: '1 / -1' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1677FF', marginBottom: '1rem' }}>QUANTUM AI</div>
                <p style={{ fontSize: '1.1rem', color: '#94A3B8', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 1.5rem' }}>Our leadership team directory is currently being updated. Please check back soon or contact us directly.</p>
                <Link href="/contact" style={{ display: 'inline-flex', padding: '0.75rem 1.5rem', backgroundColor: 'rgba(22,119,255,0.12)', border: '1px solid rgba(22,119,255,0.3)', borderRadius: 8, color: '#F8FAFF', textDecoration: 'none', fontSize: '0.875rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>CONTACT US</Link>
              </div>
            ) : members.map((m, index) => (
              <Link key={m.id} href={`/leadership/${m.slug}`} className="id-card">
                <div className="id-header">
                  <span className="id-brand">QUANTUM AI · {String(index + 1).padStart(2, '0')}</span>
                  <span className="id-pid">{m.publicId}</span>
                </div>
                <div className="id-photo">
                  {m.photo ? <img src={m.photo} alt={m.name} /> : (
                    <div className="id-photo-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                  )}
                </div>
                <div className="id-body">
                  <div className="id-name">{m.name}</div>
                  <div className="id-pos">{m.position.replaceAll("_", " ")}</div>
                  <p className="id-bio">{m.shortBio}</p>
                </div>
                <div className="id-footer">
                  {m.linkedin && (
                    <span className="id-link">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </span>
                  )}
                  <span className="id-more">VIEW PROFILE →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}