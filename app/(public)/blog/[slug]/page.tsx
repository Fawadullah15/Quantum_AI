import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';
import { createPageMetadata, getArticleSchema } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

const FALLBACK_POSTS_MAP: Record<string, any> = {
  'how-business-automation-reduces-repetitive-work': {
    title: 'How Business Process Automation Reduces Repetitive Work & Human Error',
    slug: 'how-business-automation-reduces-repetitive-work',
    excerpt: 'Explore how modern businesses replace manual data entry, disconnected spreadsheets, and delayed status handoffs with event-driven automation pipelines.',
    category: 'Automation',
    tags: '["Business Automation", "Workflow Optimization", "Process Efficiency"]',
    author: 'Quantum AI Engineering',
    published: true,
    publishedAt: new Date('2026-02-15'),
    createdAt: new Date('2026-02-15'),
    serviceLink: '/services/business-automation',
    serviceName: 'Business Workflow Automation',
    content: `
<h2>The True Cost of Manual Operational Friction</h2>
<p>In growing organizations, routine operational tasks accumulate invisibly. Team members spend hours each week manually copy-pasting customer details between platforms, reconciling spreadsheet entries, sending follow-up emails, and chasing status approvals. While these tasks seem small individually, together they create systemic bottlenecks, increase human error, and distract high-value employees from core business objectives.</p>

<h2>What Is Business Process Automation?</h2>
<p>Business Process Automation (BPA) refers to the use of technology to execute recurring, rule-based operational tasks automatically. Unlike superficial scripts, modern automation architectures connect deeply into your databases, CRM tools, ERP systems, and communication channels to synchronize data in real time.</p>

<h2>High-Impact Workflows to Automate First</h2>
<ul>
  <li><strong>Lead Ingestion & CRM Routing:</strong> Automatically parse new inquiries, qualify lead parameters, and assign them directly to the appropriate sales representative with instant notifications.</li>
  <li><strong>Document & Invoice Processing:</strong> Extract key financial data from incoming invoices and automatically update internal accounting records.</li>
  <li><strong>Inventory & Reorder Triggers:</strong> Sync stock levels across offline shops and online platforms, sending proactive replenishment alerts when items drop below safety thresholds.</li>
  <li><strong>Cross-Department Approvals:</strong> Replace delayed email chains with automated notification loops and one-click authorization workflows.</li>
</ul>

<h2>Event-Driven Architecture vs. Scheduled Scripts</h2>
<p>Traditional automation often relied on nightly cron jobs that created delayed data states. At Quantum AI, we architect event-driven webhook pipelines. When an event occurs—such as a student paying fees or a customer completing a purchase—the pipeline reacts within milliseconds, triggering downstream verifications, database writes, and external API requests seamlessly.</p>

<h2>When to Invest in Custom Automation</h2>
<p>Off-the-shelf no-code tools are great for basic tasks, but they often struggle with complex multi-step validations, private database security, and high transaction volumes. Custom workflow automation ensures that your proprietary business logic remains fully secure within your own cloud infrastructure.</p>
`,
  },
  'custom-software-vs-off-the-shelf': {
    title: 'Custom Software vs. Off-the-Shelf SaaS: When Should Your Business Build?',
    slug: 'custom-software-vs-off-the-shelf',
    excerpt: 'A practical framework for business leaders evaluating the trade-offs between subscription SaaS platforms and proprietary custom software architectures.',
    category: 'Custom Software',
    tags: '["Custom Software", "SaaS Strategy", "Software Architecture"]',
    author: 'Quantum AI Engineering',
    published: true,
    publishedAt: new Date('2026-02-18'),
    createdAt: new Date('2026-02-18'),
    serviceLink: '/services/custom-software-development',
    serviceName: 'Custom Software Development',
    content: `
<h2>The Software Dilemma for Modern Organizations</h2>
<p>Every expanding company eventually reaches a crossroads: should you adapt your operational processes to fit an existing off-the-shelf software tool, or should you engineer custom software tailored specifically around your workflow? Making the wrong choice can result in years of operational friction, high recurring subscription costs, and lost competitive advantage.</p>

<h2>The Hidden Downsides of Off-the-Shelf SaaS</h2>
<ul>
  <li><strong>Per-Seat Subscription Escalation:</strong> As your team expands, recurring license fees grow exponentially, turning software into a major recurring liability.</li>
  <li><strong>Process Compromise:</strong> Generic SaaS platforms are designed for average workflows. You are forced to alter your unique competitive processes to match the tool's predefined constraints.</li>
  <li><strong>Fragmented Multi-Tool Sprawl:</strong> Because no single SaaS tool does everything, businesses often end up subscribing to 5–10 disconnected tools that do not share data cleanly.</li>
  <li><strong>Data Ownership & Cloud Dependency:</strong> Your core business records live in third-party cloud environments that may suffer downtime or change terms without your consent.</li>
</ul>

<h2>The Strategic Advantage of Custom Software</h2>
<p>Custom business software is built exclusively around how your organization operates. It eliminates unnecessary feature bloat, provides 100% intellectual property ownership, and enables seamless integration with your existing hardware, local networks, or private cloud servers.</p>

<h2>A 4-Point Decision Framework: When to Build Custom</h2>
<ol>
  <li><strong>Your Workflow Is Your Competitive Edge:</strong> If your delivery model, proprietary pricing algorithm, or customer experience is unique, off-the-shelf tools will dilute your advantage.</li>
  <li><strong>You Require Offline-First Reliability:</strong> For businesses in retail or regional logistics where internet connectivity fluctuates, custom offline-first desktop systems prevent costly operational interruptions.</li>
  <li><strong>You Need Unified Multi-Department Workflows:</strong> When organizations need to unify attendance, billing, and scheduling into one pane of glass, custom architecture is unmatched.</li>
  <li><strong>Total Long-Term Cost:</strong> If projected SaaS licensing over 3–5 years exceeds the one-time development and maintenance investment of custom software, building is the financially superior choice.</li>
</ol>
`,
  },
  'ai-agents-for-business-operations': {
    title: 'AI Agents for Business Operations: How Multi-Agent Systems Execute Workflows',
    slug: 'ai-agents-for-business-operations',
    excerpt: 'Beyond simple chatbots: understanding how autonomous multi-agent networks collaborate, retrieve private data, and execute multi-step business decisions.',
    category: 'Artificial Intelligence',
    tags: '["AI Agents", "Machine Learning", "RAG", "Agentic Systems"]',
    author: 'Quantum AI Engineering',
    published: true,
    publishedAt: new Date('2026-02-20'),
    createdAt: new Date('2026-02-20'),
    serviceLink: '/services/ai-development',
    serviceName: 'AI Development & Systems',
    content: `
<h2>Moving Beyond Chatbots to Autonomous Agents</h2>
<p>While conversational AI interfaces like ChatGPT gained immense consumer popularity, enterprise operations require something far more capable: autonomous AI agents. Unlike simple chat windows that generate static text responses, an AI agent is designed to observe an environment, make reasoning decisions, invoke external tools, and execute sequential tasks autonomously.</p>

<h2>How Multi-Agent Coordination Works</h2>
<p>In complex operational workflows, relying on a single AI model often results in cognitive overload and hallucinations. Instead, Quantum AI engineers multi-agent networks where specialized agents collaborate like members of an engineering team:</p>
<ul>
  <li><strong>The Dispatcher Agent:</strong> Analyzes the incoming inquiry or business trigger and routes the task to the correct specialist agent.</li>
  <li><strong>The Retrieval Agent:</strong> Performs high-speed vector similarity queries across internal knowledge bases to retrieve verified factual documents.</li>
  <li><strong>The Execution Agent:</strong> Prepares the structured response or performs the necessary API write operation.</li>
  <li><strong>The Verification Agent:</strong> Inspects the output against deterministic business schemas and safety constraints before final delivery.</li>
</ul>

<h2>Grounding AI with Enterprise RAG Architectures</h2>
<p>The primary concern for business leaders adopting AI is accuracy and data security. Retrieval-Augmented Generation (RAG) solves this by ensuring the language model only references your verified proprietary documents rather than relying on general training data. In enterprise systems, responses are generated with millisecond latency and exact source citations.</p>
`,
  },
  'connecting-disconnected-business-systems': {
    title: 'How to Unify Disconnected Business Systems with API & Data Integration',
    slug: 'connecting-disconnected-business-systems',
    excerpt: 'A technical guide on building middleware layers, bidirectional database synchronization, and event-driven API connectors across legacy and modern platforms.',
    category: 'Software Integration',
    tags: '["Software Integration", "API Connectors", "Data Architecture"]',
    author: 'Quantum AI Engineering',
    published: true,
    publishedAt: new Date('2026-02-22'),
    createdAt: new Date('2026-02-22'),
    serviceLink: '/services/software-integration',
    serviceName: 'Software & API Integration',
    content: `
<h2>The Siloed Software Problem</h2>
<p>As organizations grow, they naturally adopt specialized tools: one system for point-of-sale or student enrollment, another for accounting, a third for customer communications, and spreadsheets for everything in between. Over time, these disconnected tools create data silos where no single department has an accurate, up-to-date picture of business operations.</p>

<h2>The Consequences of Disconnected Systems</h2>
<ul>
  <li><strong>Double and Triple Data Entry:</strong> Staff must re-type the same client or financial information across multiple separate software interfaces.</li>
  <li><strong>Reconciliation Delays:</strong> Financial close and reporting are delayed by days while managers manually cross-check numbers between portals.</li>
  <li><strong>Stale Customer Information:</strong> Customer service agents see outdated records because the CRM has not received recent transaction data from the billing engine.</li>
</ul>

<h2>How Custom API Middleware Solves the Challenge</h2>
<p>Rather than replacing all your existing software at once, custom software integration introduces a lightweight, robust middleware fabric that connects your systems behind the scenes.</p>
<ul>
  <li><strong>Bidirectional Synchronization:</strong> When a transaction is recorded in your local desktop system, middleware ensures that central accounting and CRM databases are updated in real time.</li>
  <li><strong>Legacy System Adapters:</strong> Older ERP databases without REST APIs can be securely connected via background ETL workers and database bridge adapters.</li>
  <li><strong>Resilient Message Queuing:</strong> If one system experiences a temporary network outage, messages are queued securely and re-processed automatically without data loss.</li>
</ul>
`,
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dbPost = await prisma.blogPost.findUnique({ where: { slug } }).catch(() => null);
  const post = dbPost || FALLBACK_POSTS_MAP[slug];

  if (!post) return { title: 'Article Not Found' };
  
  return createPageMetadata({
    title: `${post.title} — Quantum AI`,
    description: post.excerpt || `Read ${post.title} by ${post.author || 'Quantum AI Engineering'}.`,
    path: `/blog/${slug}`,
    image: post.coverImage || undefined,
    type: 'article',
    publishedTime: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(),
    authors: post.author ? [post.author] : ['Quantum AI Engineering'],
  });
}

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({ where: { published: true }, select: { slug: true } }).catch(() => []);
  const dbSlugs = posts.map((post: { slug: string }) => ({ slug: post.slug }));
  const fallbackSlugs = Object.keys(FALLBACK_POSTS_MAP).map((slug) => ({ slug }));
  return dbSlugs.length > 0 ? dbSlugs : fallbackSlugs;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const dbPost = await prisma.blogPost.findUnique({ where: { slug } }).catch(() => null);
  const post = dbPost || FALLBACK_POSTS_MAP[slug];
  
  if (!post || post.published === false) {
    notFound();
  }

  const allPosts = await prisma.blogPost.findMany({
    where: { published: true, NOT: { slug } },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  }).catch(() => []);

  const relatedPosts = allPosts.length > 0 ? allPosts : Object.values(FALLBACK_POSTS_MAP).filter((p: any) => p.slug !== slug).slice(0, 3);
  const articleSchema = getArticleSchema(post);

  const serviceTarget = post.category?.toLowerCase().includes('auto')
    ? { name: 'Business Workflow Automation', path: '/services/business-automation' }
    : post.category?.toLowerCase().includes('ai')
    ? { name: 'Custom AI Development & Systems', path: '/services/ai-development' }
    : post.category?.toLowerCase().includes('integ')
    ? { name: 'Software & API Integration', path: '/services/software-integration' }
    : { name: 'Custom Software Development', path: '/services/custom-software-development' };

  return (
    <article style={{ paddingTop: 'calc(var(--nav-height, 72px) + 2rem)', paddingBottom: '4.5rem', paddingInline: 'var(--container-px, clamp(1.25rem, 5vw, 4rem))', minHeight: '100vh', background: 'var(--color-void, #030712)' }}>
      {/* Schema.org Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <style>{`
        .post-container {
          max-width: 820px;
          margin: 0 auto;
        }
        .post-body {
          font-size: 0.98rem;
          line-height: 1.75;
          color: #CBD5E1;
        }
        .post-body h2 {
          font-size: clamp(1.25rem, 2.2vw, 1.55rem);
          font-weight: 700;
          color: #F8FAFC;
          margin: 2.25rem 0 0.85rem 0;
          letter-spacing: -0.02em;
          border-bottom: 1px solid rgba(22, 119, 255, 0.14);
          padding-bottom: 0.4rem;
        }
        .post-body p {
          margin: 0 0 1.25rem 0;
          font-weight: 300;
        }
        .post-body ul, .post-body ol {
          margin: 0 0 1.5rem 0;
          padding-left: 1.35rem;
        }
        .post-body li {
          margin-bottom: 0.65rem;
          font-weight: 300;
        }
        .post-body a {
          color: #38BDF8;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .post-body a:hover {
          color: #1677FF;
        }
        .post-body strong {
          color: #F8FAFC;
          font-weight: 600;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 0.85rem;
          margin-top: 1rem;
        }
        .related-card {
          background: rgba(6, 21, 43, 0.65);
          border: 1px solid rgba(22, 119, 255, 0.14);
          border-radius: 8px;
          padding: 1.1rem;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.2s;
        }
        .related-card:hover {
          background: rgba(8, 28, 58, 0.85);
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-1px);
        }
      `}</style>

      <div className="post-container">
        {/* Breadcrumb Back */}
        <Link
          href="/blog"
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.72rem',
            color: '#38BDF8',
            textDecoration: 'none',
            letterSpacing: '0.1em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '1.25rem',
          }}
        >
          ← BACK TO INSIGHTS
        </Link>

        {/* Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', textTransform: 'uppercase', color: '#38BDF8', marginBottom: '0.65rem' }}>
            {post.category && <span>{post.category}</span>}
            {post.category && <span>·</span>}
            <span style={{ color: '#64748B' }}>{new Date(post.publishedAt ?? post.createdAt).toLocaleDateString()}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 1rem 0', color: '#F8FAFC' }}>
            {post.title}
          </h1>
          {post.author && (
            <div style={{ color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem' }}>
              Written by <span style={{ color: '#F8FAFC' }}>{post.author}</span>
            </div>
          )}
        </header>

        {/* Post Content */}
        <div className="post-body" dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* ─── Relevant Service CTA Banner ─── */}
        <div style={{ marginTop: '3rem', background: 'rgba(6, 21, 43, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 10, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', color: '#38BDF8', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>
            EXPLORE RELATED ARCHITECTURE
          </div>
          <h3 style={{ fontSize: '1.2rem', color: '#F8FAFC', margin: 0, fontWeight: 600 }}>
            Need {serviceTarget.name} for your organization?
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: 0, lineHeight: 1.5, fontWeight: 300 }}>
            Quantum AI engineers custom production software, automation pipelines, and AI systems tailored to real business workflows.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Link
              href={serviceTarget.path}
              style={{
                display: 'inline-block',
                padding: '0.65rem 1.25rem',
                backgroundColor: '#1677FF',
                color: '#fff',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.08em',
                fontSize: '0.75rem',
              }}
            >
              VIEW {serviceTarget.name.toUpperCase()} →
            </Link>
            <Link
              href="/contact"
              style={{
                display: 'inline-block',
                padding: '0.65rem 1.25rem',
                backgroundColor: 'rgba(22, 119, 255, 0.08)',
                border: '1px solid rgba(22, 119, 255, 0.3)',
                color: '#38BDF8',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.08em',
                fontSize: '0.75rem',
              }}
            >
              START A PROJECT
            </Link>
          </div>
        </div>

        {/* ─── Related Articles ─── */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: '3.5rem', borderTop: '1px solid rgba(22, 119, 255, 0.14)', paddingTop: '2.25rem' }}>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.68rem', color: '#1677FF', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>READ NEXT</div>
            <h2 style={{ fontSize: '1.25rem', color: '#F8FAFC', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>
              RELATED ARTICLES
            </h2>

            <div className="related-grid">
              {relatedPosts.map((r: any) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="related-card">
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.65rem', color: '#38BDF8', textTransform: 'uppercase', fontWeight: 600 }}>
                      {r.category}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', color: '#F8FAFC', margin: '0.35rem 0 0.45rem 0', lineHeight: 1.35, fontWeight: 600 }}>
                      {r.title}
                    </h4>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.7rem', color: '#1677FF', fontWeight: 600 }}>
                    READ &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
