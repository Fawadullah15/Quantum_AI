export const metadata = {
  title: "About",
  description: "Why Quantum AI exists and how we think about building technology.",
};

const principles = [
  {
    num: "01",
    title: ["Think", "Clearly."],
    body: "We start with the problem before choosing the technology. By understanding the core issue, we avoid unnecessary complexity and build direct, effective solutions.",
  },
  {
    num: "02",
    title: ["Build", "With Purpose."],
    body: "Every system should have a reason to exist. We don't add features for the sake of them. Each decision is intentional, each line of code is justified.",
  },
  {
    num: "03",
    title: ["Keep", "It Simple."],
    body: "Complex technology should create simple experiences. The best software disappears — it just works, without friction, without confusion.",
  },
  {
    num: "04",
    title: ["Design for", "the Real World."],
    body: "Software must work for real people, teams, and businesses. We build systems that integrate naturally into how organizations operate today.",
  },
];

export default function AboutPage() {
  return (
    <>
      <style>{`
        .abt-page {
          padding-top: calc(var(--nav-height, 80px) + 4rem);
          padding-bottom: 6rem;
          padding-inline: clamp(1.25rem, 5vw, 4rem);
          min-height: 100vh;
          background: var(--color-void, #030712);
          position: relative;
          overflow-x: hidden;
        }
        .abt-page::before {
          content: "";
          position: fixed;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 80vw; height: 55vh;
          background: radial-gradient(ellipse at top, rgba(37,99,235,0.05) 0%, rgba(79,70,229,0.025) 45%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .abt-inner { max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }
        .abt-eyebrow { font-family: var(--font-mono, monospace); font-size: 0.7rem; letter-spacing: 0.2em; color: #64748B; text-transform: uppercase; margin-bottom: 1.75rem; }
        .abt-h1 { font-size: clamp(3.25rem, 7.5vw, 7.5rem); font-weight: 700; line-height: 0.92; letter-spacing: -0.045em; color: #F8FAFC; text-transform: uppercase; margin-bottom: 2rem; }
        .abt-lead { font-size: clamp(1.05rem, 1.5vw, 1.25rem); color: #A8B3C7; max-width: 600px; line-height: 1.75; margin-bottom: 5.5rem; }
        .abt-principles-header { font-family: var(--font-mono, monospace); font-size: 0.68rem; letter-spacing: 0.2em; color: #64748B; text-transform: uppercase; padding-bottom: 2rem; border-bottom: 1px solid rgba(30,58,138,0.22); margin-bottom: 0; }
        .principle { padding: 2.75rem 0; border-bottom: 1px solid rgba(30,58,138,0.22); display: grid; grid-template-columns: 72px 1fr 1fr; gap: 2rem; align-items: start; transition: border-bottom-color 0.3s; cursor: default; }
        .principle:hover { border-bottom-color: rgba(37,99,235,0.38); }
        @media (max-width: 640px) { .principle { grid-template-columns: 52px 1fr; } .principle-body { grid-column: 1 / -1; } }
        .principle-num { font-family: var(--font-mono, monospace); font-size: 0.78rem; color: #334155; letter-spacing: 0.08em; padding-top: 0.45rem; transition: color 0.3s; }
        .principle:hover .principle-num { color: #2563EB; }
        .principle-title { font-size: clamp(2rem, 3.5vw, 3.25rem); font-weight: 700; line-height: 1.0; letter-spacing: -0.03em; color: #F8FAFC; }
        .principle-title span { display: block; }
        .principle-body { font-size: 1rem; color: #71809A; line-height: 1.8; max-width: 540px; padding-top: 0.5rem; transition: color 0.3s; }
        .principle:hover .principle-body { color: #A8B3C7; }
      `}</style>
      <div className="abt-page">
        <div className="abt-inner">
          <section style={{ marginBottom: 0 }}>
            <p className="abt-eyebrow">[00 — PHILOSOPHY]</p>
            <h1 className="abt-h1">Why<br />Quantum AI.</h1>
            <p className="abt-lead">
              We don&apos;t build technology for the sake of technology.<br />
              We build systems that solve real problems.
            </p>
          </section>
          <section>
            <p className="abt-principles-header">[01 — PRINCIPLES]</p>
            {principles.map((p) => (
              <div key={p.num} className="principle">
                <span className="principle-num">{p.num}</span>
                <h2 className="principle-title">
                  {p.title.map((line, i) => <span key={i}>{line}</span>)}
                </h2>
                <p className="principle-body">{p.body}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}