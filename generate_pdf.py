import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running Header
        self.drawString(54, letter[1] - 36, "QUANTUM AI — Complete System Architecture & Platform Documentation")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Running Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 36, page_str)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — QUANTUM AI ARCHITECTURE")
        self.line(54, 48, letter[0] - 54, 48)
        self.restoreState()

def create_quantum_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    c_primary = colors.HexColor("#0F172A")    # Slate 900
    c_brand = colors.HexColor("#0284C7")      # Sky 600
    c_accent = colors.HexColor("#2563EB")     # Blue 600
    c_dark_accent = colors.HexColor("#1E3A8A")# Blue 900
    c_text = colors.HexColor("#334155")       # Slate 700
    c_muted = colors.HexColor("#64748B")      # Slate 500
    c_bg_light = colors.HexColor("#F8FAFC")   # Slate 50
    c_card_border = colors.HexColor("#E2E8F0")# Slate 200

    # Custom Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=colors.HexColor("#FFFFFF"),
        alignment=0,
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#94A3B8"),
        alignment=0,
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_dark_accent,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_primary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=c_text,
        spaceAfter=6,
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=4,
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#F1F5F9"),
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6,
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_text,
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=c_primary,
    )

    story = []

    # ═════════════════════════════════════════════════════════════════
    # 1. COVER PAGE / EXECUTIVE HEADER
    # ═════════════════════════════════════════════════════════════════
    cover_data = [
        [
            Paragraph("QUANTUM AI", ParagraphStyle('PBrand', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor("#38BDF8"), leading=12)),
        ],
        [
            Spacer(1, 4),
        ],
        [
            Paragraph("Comprehensive Technical Specification & Platform Documentation", title_style),
        ],
        [
            Spacer(1, 8),
        ],
        [
            Paragraph("Full-Stack Architecture, Public Experience, Admin CMS, Database Schema, API Reference & Security Model", subtitle_style),
        ],
        [
            Spacer(1, 16),
        ],
        [
            Paragraph("<b>Version:</b> 2.0 Production Ready &nbsp;|&nbsp; <b>Framework:</b> Next.js 16/17 (App Router) &nbsp;|&nbsp; <b>Database:</b> PostgreSQL (Prisma ORM)<br/><b>Published:</b> August 2026 &nbsp;|&nbsp; <b>Website:</b> https://quantumai-snowy.vercel.app", ParagraphStyle('PCoverMeta', fontName='Helvetica', fontSize=8.5, textColor=colors.HexColor("#CBD5E1"), leading=13)),
        ]
    ]

    cover_table = Table(cover_data, colWidths=[504])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#06152B")),
        ('LEFTPADDING', (0, 0), (-1, -1), 24),
        ('RIGHTPADDING', (0, 0), (-1, -1), 24),
        ('TOPPADDING', (0, 0), (-1, -1), 28),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 28),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('CORNERPAD', (0, 0), (-1, -1), 8),
    ]))

    story.append(cover_table)
    story.append(Spacer(1, 20))

    # ═════════════════════════════════════════════════════════════════
    # 2. EXECUTIVE SUMMARY & ARCHITECTURE OVERVIEW
    # ═════════════════════════════════════════════════════════════════
    story.append(Paragraph("1. Executive Summary & Architecture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_brand, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "<b>Quantum AI</b> is a high-performance enterprise platform engineered for scale, intelligent agent orchestration, neural networks, and modern software deployments. The platform integrates a futuristic 3D WebGL user experience with a robust, real-time Content Management System (CMS) and strict role-based access control (RBAC).",
        body_style
    ))

    arch_data = [
        [Paragraph("Layer", table_header_style), Paragraph("Technology / Component", table_header_style), Paragraph("Key Role / Functionality", table_header_style)],
        [Paragraph("<b>Frontend Framework</b>", table_cell_style), Paragraph("Next.js 16.3.1 (React 19, App Router)", table_cell_style), Paragraph("Server Components (RSC), SSR, Turbopack, Fast Dynamic Routing", table_cell_style)],
        [Paragraph("<b>3D & Visual Graphics</b>", table_cell_style), Paragraph("Three.js, @react-three/fiber, Drei", table_cell_style), Paragraph("20+ interactive 3D WebGL scenes, particle networks, globe animations", table_cell_style)],
        [Paragraph("<b>Styling & Animations</b>", table_cell_style), Paragraph("CSS Modules, Framer Motion, GSAP", table_cell_style), Paragraph("Futuristic typography, smooth transitions, responsive micro-interactions", table_cell_style)],
        [Paragraph("<b>Database & ORM</b>", table_cell_style), Paragraph("PostgreSQL (Neon) + Prisma 6.19", table_cell_style), Paragraph("17 relational data models, connection pooling, automated migrations", table_cell_style)],
        [Paragraph("<b>Authentication & Auth</b>", table_cell_style), Paragraph("NextAuth.js v4 (JWT Strategy) + bcrypt", table_cell_style), Paragraph("Role-based access (SUPER_ADMIN, ADMIN, EDITOR), credentials login", table_cell_style)],
        [Paragraph("<b>Edge Security</b>", table_cell_style), Paragraph("Next.js Edge Middleware", table_cell_style), Paragraph("Edge-level route guard protecting all /admin and /api/admin endpoints", table_cell_style)],
        [Paragraph("<b>Asset Storage</b>", table_cell_style), Paragraph("@vercel/blob + Local FS Fallback", table_cell_style), Paragraph("High-speed CDN storage for media uploads (images, PDFs, documents)", table_cell_style)],
        [Paragraph("<b>Deployment & Edge</b>", table_cell_style), Paragraph("Vercel Global Edge Network", table_cell_style), Paragraph("Automated CI/CD, regional deployment, instant cache revalidations", table_cell_style)],
    ]

    t_arch = Table(arch_data, colWidths=[110, 160, 234])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_dark_accent),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, c_card_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 14))

    # ═════════════════════════════════════════════════════════════════
    # 3. PUBLIC WEBSITE ARCHITECTURE (17 ROUTES)
    # ═════════════════════════════════════════════════════════════════
    story.append(Paragraph("2. Public Website Map & Route Specifications", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_brand, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph(
        "The public website exposes 17 dedicated routes providing full coverage of company services, software products, client case studies, thought leadership, and interactive contact touchpoints.",
        body_style
    ))

    routes_data = [
        [Paragraph("Public Route", table_header_style), Paragraph("Render Type", table_header_style), Paragraph("Description & Connected Data Source", table_header_style)],
        [Paragraph("<b>/ (Homepage)</b>", table_cell_style), Paragraph("Dynamic / Client", table_cell_style), Paragraph("3D Hero Scene, Capabilities, Selected Case Studies, Live Leadership directory, Interactive World Presence Map, Direct Inquiries Form.", table_cell_style)],
        [Paragraph("<b>/about</b>", table_cell_style), Paragraph("Static (SSG)", table_cell_style), Paragraph("Company manifesto, core operating principles ('Think Clearly', 'Build with Purpose', 'Keep it Simple', 'Design for the Real World').", table_cell_style)],
        [Paragraph("<b>/services</b>", table_cell_style), Paragraph("Dynamic (SSR)", table_cell_style), Paragraph("Complete technical services catalog querying Prisma Service model with anchor navigation (#ai, #software, #automation, #products).", table_cell_style)],
        [Paragraph("<b>/products</b>", table_cell_style), Paragraph("Dynamic (SSR)", table_cell_style), Paragraph("Software systems directory querying Prisma Product with feature specs, tags, order sorting, and status badges (LIVE, BETA).", table_cell_style)],
        [Paragraph("<b>/products/[slug]</b>", table_cell_style), Paragraph("Dynamic / SSG", table_cell_style), Paragraph("Comprehensive product landing page with feature breakdown (ProductFeature), live demo links, documentation, and tech tags.", table_cell_style)],
        [Paragraph("<b>/work</b>", table_cell_style), Paragraph("Dynamic (SSR)", table_cell_style), Paragraph("Portfolio of client deployments from Prisma CaseStudy, metrics preview, and tech stack tags.", table_cell_style)],
        [Paragraph("<b>/work/[slug]</b>", table_cell_style), Paragraph("Dynamic / SSG", table_cell_style), Paragraph("Detailed case study deep-dive showcasing problem, solution, implementation, architecture, and quantitative metrics (ROI, speed, scale).", table_cell_style)],
        [Paragraph("<b>/case-studies</b>", table_cell_style), Paragraph("Dynamic (SSR)", table_cell_style), Paragraph("Alias route providing seamless access to client case studies index.", table_cell_style)],
        [Paragraph("<b>/case-studies/[slug]</b>", table_cell_style), Paragraph("Dynamic / SSG", table_cell_style), Paragraph("Alias route loading corresponding client case study detail page.", table_cell_style)],
        [Paragraph("<b>/leadership</b>", table_cell_style), Paragraph("Dynamic (SSR)", table_cell_style), Paragraph("Company leadership directory querying Prisma Leadership model ordered by displayOrder with ID badges and 2x2 responsive cards.", table_cell_style)],
        [Paragraph("<b>/leadership/[slug]</b>", table_cell_style), Paragraph("Dynamic (SSR)", table_cell_style), Paragraph("Individual executive biography page, department, location, contact, and direct social links (LinkedIn, Website, Email).", table_cell_style)],
        [Paragraph("<b>/technology</b>", table_cell_style), Paragraph("Dynamic (SSR)", table_cell_style), Paragraph("Core technology catalog grouped by category (AI/ML, Frontend, Backend, Infrastructure, Database) with usage documentation.", table_cell_style)],
        [Paragraph("<b>/technologies/[slug]</b>", table_cell_style), Paragraph("Dynamic (SSR)", table_cell_style), Paragraph("In-depth architecture specification for individual stack frameworks with key capabilities, use cases, and direct CTA.", table_cell_style)],
        [Paragraph("<b>/blog</b>", table_cell_style), Paragraph("Static (SSG)", table_cell_style), Paragraph("Blog and publication feed querying published articles from Prisma BlogPost with dates, authors, and category tags.", table_cell_style)],
        [Paragraph("<b>/blog/[slug]</b>", table_cell_style), Paragraph("Dynamic / SSG", table_cell_style), Paragraph("Article reader with HTML rendering, cover image, author badge, reading metadata, and tag taxonomies.", table_cell_style)],
        [Paragraph("<b>/insights</b>", table_cell_style), Paragraph("Dynamic (SSR)", table_cell_style), Paragraph("Curated intelligence databank highlighting featured research papers and technical publications.", table_cell_style)],
        [Paragraph("<b>/contact</b>", table_cell_style), Paragraph("Client Form", table_cell_style), Paragraph("Client-side inquiry form submitting to /api/contact with realtime validation, error recovery, and 24h SLA guarantees.", table_cell_style)],
        [Paragraph("<b>/careers</b>", table_cell_style), Paragraph("Static (SSG)", table_cell_style), Paragraph("Open engineering and research positions across AI, Systems, Design, and Product orbits.", table_cell_style)],
        [Paragraph("<b>/industries</b>", table_cell_style), Paragraph("Static (SSG)", table_cell_style), Paragraph("Sector overview covering Healthcare, Finance, Logistics, Education, Manufacturing, Retail, and Government.", table_cell_style)],
        [Paragraph("<b>/philosophy</b>", table_cell_style), Paragraph("Static (SSG)", table_cell_style), Paragraph("Design tenets: Aesthetics = Utility, Architectural Scale, and Systemic Intelligence.", table_cell_style)],
        [Paragraph("<b>/research</b>", table_cell_style), Paragraph("Static (SSG)", table_cell_style), Paragraph("Intelligence lab focus areas: Autonomous Systems, Multi-Modal Reasoning, and Generative Workflows.", table_cell_style)],
        [Paragraph("<b>/systems</b>", table_cell_style), Paragraph("Dynamic (SSR)", table_cell_style), Paragraph("Computational architecture nodes and neural intelligent system catalog.", table_cell_style)],
    ]

    t_routes = Table(routes_data, colWidths=[120, 90, 294])
    t_routes.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_dark_accent),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, c_card_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_routes)
    story.append(Spacer(1, 14))

    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════
    # 4. ADMIN PANEL & CONTENT MANAGEMENT SYSTEM (CMS)
    # ═════════════════════════════════════════════════════════════════
    story.append(Paragraph("3. Admin Panel & Content Management System", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_brand, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "The administrative panel is located at <code>/admin</code> and serves as the single source of truth for all content across the platform. Built with a responsive dark-mode shell, collapsible vertical sidebar, realtime notifications, and Server Actions with automated cache revalidation.",
        body_style
    ))

    admin_modules = [
        [Paragraph("Admin Section", table_header_style), Paragraph("Route Path", table_header_style), Paragraph("CRUD Capabilities & Management Features", table_header_style)],
        [Paragraph("<b>Dashboard Overview</b>", table_cell_style), Paragraph("/admin", table_cell_style), Paragraph("Aggregates real-time KPIs: unread messages, active leaders, published products, case studies, blog posts, and quick action buttons.", table_cell_style)],
        [Paragraph("<b>Contact Inquiries</b>", table_cell_style), Paragraph("/admin/messages<br/>/admin/messages/[id]", table_cell_style), Paragraph("Inbox of contact submissions with search, status filtering (NEW, CONTACTED, IN_PROGRESS, CLOSED), detail inspection, and internal note taking.", table_cell_style)],
        [Paragraph("<b>Leadership & Team</b>", table_cell_style), Paragraph("/admin/leadership<br/>/admin/leadership/new<br/>/admin/leadership/[id]/edit", table_cell_style), Paragraph("Full executive profile management: photo upload via Media Library, unique publicId autogen, position, department, bios, social links, display reordering, and active status toggle.", table_cell_style)],
        [Paragraph("<b>Works & Case Studies</b>", table_cell_style), Paragraph("/admin/case-studies<br/>/admin/case-studies/new", table_cell_style), Paragraph("Manage client deployments: client, industry, problem, solution, implementation, quantitative metrics pairs (label, value, description), gallery URLs, external link, and order.", table_cell_style)],
        [Paragraph("<b>Software Products</b>", table_cell_style), Paragraph("/admin/products<br/>/admin/products/new", table_cell_style), Paragraph("Software product catalog manager: inline editing, product status (LIVE, BETA, IN_DEVELOPMENT, PLANNED), dynamic feature lists, demo/docs links, and tech stack tags.", table_cell_style)],
        [Paragraph("<b>Services & Capabilities</b>", table_cell_style), Paragraph("/admin/services<br/>/admin/services/new", table_cell_style), Paragraph("Capability manager: category assignment (AI, SOFTWARE, PRODUCT, CONSULTING), descriptions, icons, ordering, and publication toggles.", table_cell_style)],
        [Paragraph("<b>Technology Stack</b>", table_cell_style), Paragraph("/admin/technology<br/>/admin/technology/new", table_cell_style), Paragraph("Technology directory: categories, short descriptions, usage guidelines, project associations, icons, and automated slug generation.", table_cell_style)],
        [Paragraph("<b>Blog Articles</b>", table_cell_style), Paragraph("/admin/blog<br/>/admin/blog/new", table_cell_style), Paragraph("Article publishing engine: rich content editor, slug generation, category, author, comma-separated tags, publication status, and SEO metadata.", table_cell_style)],
        [Paragraph("<b>Client Testimonials</b>", table_cell_style), Paragraph("/admin/testimonials", table_cell_style), Paragraph("Client review manager: client name, company, role, rating (1-5 stars), quote content, and publication ordering.", table_cell_style)],
        [Paragraph("<b>Media Library</b>", table_cell_style), Paragraph("/admin/media", table_cell_style), Paragraph("Asset storage manager: multi-part uploads (JPEG, PNG, WebP, GIF, SVG, MP4, PDF up to 10MB), Vercel Blob sync, copy direct URL, preview, and asset deletion.", table_cell_style)],
        [Paragraph("<b>Site Settings</b>", table_cell_style), Paragraph("/admin/settings", table_cell_style), Paragraph("Global key-value configuration: site title, support email, contact phone, office addresses, and brand properties.", table_cell_style)],
        [Paragraph("<b>Authentication</b>", table_cell_style), Paragraph("/admin/login", table_cell_style), Paragraph("Secure administrative login screen with credential validation, loading indicators, and active session redirect.", table_cell_style)],
    ]

    t_admin = Table(admin_modules, colWidths=[120, 120, 264])
    t_admin.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_dark_accent),
        ('PADDING', (0, 0), (-1, -1), 4.5),
        ('GRID', (0, 0), (-1, -1), 0.5, c_card_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_admin)
    story.append(Spacer(1, 14))

    # ═════════════════════════════════════════════════════════════════
    # 5. API REFERENCE (23 ENDPOINTS)
    # ═════════════════════════════════════════════════════════════════
    story.append(Paragraph("4. Backend REST API Endpoints Reference", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_brand, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "The backend is powered by Next.js Route Handlers delivering high-performance JSON endpoints protected with NextAuth session validation.",
        body_style
    ))

    api_data = [
        [Paragraph("Endpoint", table_header_style), Paragraph("Methods", table_header_style), Paragraph("Auth", table_header_style), Paragraph("Prisma Model & Functional Purpose", table_header_style)],
        [Paragraph("/api/leadership", table_cell_style), Paragraph("GET, POST", table_cell_style), Paragraph("POST: Yes", table_cell_style), Paragraph("Leadership — Fetch active leaders or create leader with collision-free QA-XXX publicId.", table_cell_style)],
        [Paragraph("/api/leadership/[id]", table_cell_style), Paragraph("GET, PATCH, DELETE", table_cell_style), Paragraph("Yes", table_cell_style), Paragraph("Leadership — Retrieve, update profile details, or delete record with cache revalidation.", table_cell_style)],
        [Paragraph("/api/products", table_cell_style), Paragraph("GET, POST", table_cell_style), Paragraph("POST: Yes", table_cell_style), Paragraph("Product — List published products with features relation or create new software product.", table_cell_style)],
        [Paragraph("/api/products/[slug]", table_cell_style), Paragraph("GET, PATCH, DELETE", table_cell_style), Paragraph("PATCH/DEL: Yes", table_cell_style), Paragraph("Product — Fetch product by slug with features, update product, or delete.", table_cell_style)],
        [Paragraph("/api/case-studies", table_cell_style), Paragraph("GET, POST", table_cell_style), Paragraph("POST: Yes", table_cell_style), Paragraph("CaseStudy — List deployments with metrics relation or publish new client study.", table_cell_style)],
        [Paragraph("/api/case-studies/[slug]", table_cell_style), Paragraph("GET, PATCH, DELETE", table_cell_style), Paragraph("PATCH/DEL: Yes", table_cell_style), Paragraph("CaseStudy — Deep-dive retrieval with metrics, update case study, or delete.", table_cell_style)],
        [Paragraph("/api/services", table_cell_style), Paragraph("GET, POST", table_cell_style), Paragraph("POST: Yes", table_cell_style), Paragraph("Service — Fetch capability catalog by order or register new service offering.", table_cell_style)],
        [Paragraph("/api/services/[id]", table_cell_style), Paragraph("GET, PATCH, DELETE", table_cell_style), Paragraph("Yes", table_cell_style), Paragraph("Service — Full individual service CRUD by ID with 404 validation.", table_cell_style)],
        [Paragraph("/api/technology", table_cell_style), Paragraph("GET, POST", table_cell_style), Paragraph("POST: Yes", table_cell_style), Paragraph("Technology — List technology stacks by category or register new technology.", table_cell_style)],
        [Paragraph("/api/technology/[id]", table_cell_style), Paragraph("GET, PATCH, DELETE", table_cell_style), Paragraph("Yes", table_cell_style), Paragraph("Technology — Retrieve, update technology attributes, or delete.", table_cell_style)],
        [Paragraph("/api/blog", table_cell_style), Paragraph("GET, POST", table_cell_style), Paragraph("POST: Yes", table_cell_style), Paragraph("BlogPost — Paginated article feed with tag/category filters or create article.", table_cell_style)],
        [Paragraph("/api/blog/[slug]", table_cell_style), Paragraph("GET, PATCH, DELETE", table_cell_style), Paragraph("PATCH/DEL: Yes", table_cell_style), Paragraph("BlogPost — Single article reader, update article content, or delete.", table_cell_style)],
        [Paragraph("/api/contact", table_cell_style), Paragraph("POST", table_cell_style), Paragraph("No", table_cell_style), Paragraph("ContactSubmission — Public form handler saving inquiries and triggering admin alerts.", table_cell_style)],
        [Paragraph("/api/admin/contact", table_cell_style), Paragraph("GET", table_cell_style), Paragraph("Yes", table_cell_style), Paragraph("ContactSubmission — Paginated admin search with status filtering.", table_cell_style)],
        [Paragraph("/api/admin/contact/[id]", table_cell_style), Paragraph("GET, PATCH, DELETE", table_cell_style), Paragraph("Yes", table_cell_style), Paragraph("ContactSubmission — Inquiry detail view, update status/internal notes, or archive.", table_cell_style)],
        [Paragraph("/api/admin/notifications", table_cell_style), Paragraph("GET", table_cell_style), Paragraph("Yes", table_cell_style), Paragraph("ContactSubmission — Returns unread message count and latest inquiries for topbar badge.", table_cell_style)],
        [Paragraph("/api/admin/settings", table_cell_style), Paragraph("GET, PATCH", table_cell_style), Paragraph("Yes", table_cell_style), Paragraph("SiteSettings — Key-value configuration retrieval or bulk upsert.", table_cell_style)],
        [Paragraph("/api/media", table_cell_style), Paragraph("GET, POST", table_cell_style), Paragraph("Yes", table_cell_style), Paragraph("Media — Fetch media library or upload multi-part file to Vercel Blob/Local FS.", table_cell_style)],
        [Paragraph("/api/media/[id]", table_cell_style), Paragraph("DELETE", table_cell_style), Paragraph("Yes", table_cell_style), Paragraph("Media — Remove asset from database and purge from Vercel Blob store.", table_cell_style)],
        [Paragraph("/api/auth/[...nextauth]", table_cell_style), Paragraph("GET, POST", table_cell_style), Paragraph("N/A", table_cell_style), Paragraph("User — NextAuth v4 credentials authentication, session token issuance.", table_cell_style)],
        [Paragraph("/api/analytics", table_cell_style), Paragraph("GET, POST", table_cell_style), Paragraph("No", table_cell_style), Paragraph("Telemetry — Ingest client-side performance and navigation events.", table_cell_style)],
        [Paragraph("/robots.txt", table_cell_style), Paragraph("GET", table_cell_style), Paragraph("No", table_cell_style), Paragraph("SEO — Dynamic robots crawl directives and sitemap declaration.", table_cell_style)],
    ]

    t_api = Table(api_data, colWidths=[130, 80, 54, 240])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_dark_accent),
        ('PADDING', (0, 0), (-1, -1), 3.5),
        ('GRID', (0, 0), (-1, -1), 0.5, c_card_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_api)
    story.append(Spacer(1, 14))

    story.append(PageBreak())

    # ═════════════════════════════════════════════════════════════════
    # 6. DATABASE SCHEMA & DATA MODELS
    # ═════════════════════════════════════════════════════════════════
    story.append(Paragraph("5. Database Schema & Prisma Data Models", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_brand, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "The relational database schema is managed via Prisma ORM connected to PostgreSQL. It consists of 17 core models structured for integrity, auditability, and speed.",
        body_style
    ))

    schema_data = [
        [Paragraph("Model Name", table_header_style), Paragraph("Key Fields & Types", table_header_style), Paragraph("Relations & Integrity Rules", table_header_style)],
        [Paragraph("<b>User</b>", table_cell_style), Paragraph("id (cuid), email (unique), name, password (hash), role (SUPER_ADMIN, ADMIN, EDITOR), createdAt, updatedAt", table_cell_style), Paragraph("1-to-many with ActivityLog. Authenticates admin operators.", table_cell_style)],
        [Paragraph("<b>Leadership</b>", table_cell_style), Paragraph("id, publicId (unique e.g. QA-001), slug (unique), name, position, department, shortBio, fullBio, photo, email, linkedin, website, location, displayOrder (Int), isActive (Bool)", table_cell_style), Paragraph("Single source of truth for all leadership, founders, and team members on public cards and profile pages.", table_cell_style)],
        [Paragraph("<b>Product</b>", table_cell_style), Paragraph("id, name, slug (unique), description, category, status (LIVE, BETA, IN_DEV, PLANNED), heroImage, demoUrl, docsUrl, technologies (String), published, order", table_cell_style), Paragraph("1-to-many cascade relation with ProductFeature.", table_cell_style)],
        [Paragraph("<b>ProductFeature</b>", table_cell_style), Paragraph("id, productId (FK), title, description, order", table_cell_style), Paragraph("Belongs to Product. Automatically created on product publish.", table_cell_style)],
        [Paragraph("<b>CaseStudy</b>", table_cell_style), Paragraph("id, title, slug (unique), client, industry, problem, solution, implementation, technologies, results, year (Int), services, heroImage, gallery (JSON string), externalUrl, published, order", table_cell_style), Paragraph("1-to-many cascade relation with CaseStudyMetric.", table_cell_style)],
        [Paragraph("<b>CaseStudyMetric</b>", table_cell_style), Paragraph("id, caseStudyId (FK), label, value, description", table_cell_style), Paragraph("Belongs to CaseStudy. Stores quantitative ROI/performance pairs.", table_cell_style)],
        [Paragraph("<b>Service</b>", table_cell_style), Paragraph("id, name, category (AI, SOFTWARE, PRODUCT, CONSULTING), description, icon, order, published", table_cell_style), Paragraph("Populates both /services capabilities and /systems architecture views.", table_cell_style)],
        [Paragraph("<b>Technology</b>", table_cell_style), Paragraph("id, slug (unique), name, shortDescription, category, heroTitle, heroDescription, heroImage, content, features (JSON), useCases (JSON), ctaTitle, ctaText, ctaLink, usage, projects, icon, order, published", table_cell_style), Paragraph("Powers both the category directory and dedicated technology deep-dives.", table_cell_style)],
        [Paragraph("<b>BlogPost</b>", table_cell_style), Paragraph("id, title, slug (unique), excerpt, content (HTML/MD), coverImage, category, tags (JSON array string), author, published, publishedAt, metaTitle, metaDesc", table_cell_style), Paragraph("Powers both /blog editorial and /insights databank.", table_cell_style)],
        [Paragraph("<b>Testimonial</b>", table_cell_style), Paragraph("id, name, company, role, content, rating (Int 1-5), photo, published, order", table_cell_style), Paragraph("Feeds verified client reviews to homepage carousel.", table_cell_style)],
        [Paragraph("<b>ContactSubmission</b>", table_cell_style), Paragraph("id, name, email, company, phone, projectType, budget, message, status (NEW, CONTACTED, IN_PROGRESS, CLOSED, ARCHIVED), notes, createdAt", table_cell_style), Paragraph("Stores incoming inquiries from public forms.", table_cell_style)],
        [Paragraph("<b>Media</b>", table_cell_style), Paragraph("id, filename, url, type, size (Int), alt, createdAt", table_cell_style), Paragraph("Tracks assets uploaded to cloud storage.", table_cell_style)],
        [Paragraph("<b>SiteSettings</b>", table_cell_style), Paragraph("id, key (unique), value, updatedAt", table_cell_style), Paragraph("Stores global website configuration key-value pairs.", table_cell_style)],
        [Paragraph("<b>ActivityLog</b>", table_cell_style), Paragraph("id, userId (FK), action, entity, entityId, details, createdAt", table_cell_style), Paragraph("Audit log recording administrator actions and modifications.", table_cell_style)],
    ]

    t_schema = Table(schema_data, colWidths=[110, 194, 200])
    t_schema.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_dark_accent),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, c_card_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_schema)
    story.append(Spacer(1, 14))

    # ═════════════════════════════════════════════════════════════════
    # 7. SECURITY & ACCESS CONTROL MODEL
    # ═════════════════════════════════════════════════════════════════
    story.append(Paragraph("6. Security Architecture & Access Control", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_brand, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "Security is implemented across multiple defensive layers to ensure data privacy, prevent unauthorized mutations, and guarantee zero data loss.",
        body_style
    ))

    story.append(Paragraph("• <b>Edge Middleware Protection:</b> Configured in <code>middleware.ts</code> using NextAuth <code>withAuth</code>. Intercepts incoming requests at the edge and rejects unauthenticated traffic to <code>/admin/*</code> and <code>/api/admin/*</code> with immediate redirect to <code>/admin/login</code>.", bullet_style))
    story.append(Paragraph("• <b>Server Action Authentication Guards:</b> All admin mutations (create, update, delete, reorder) in Server Actions verify <code>await getServerSession(authOptions)</code> before executing Prisma queries.", bullet_style))
    story.append(Paragraph("• <b>Password Security:</b> User passwords hashed using <code>bcryptjs</code> with high salt rounds. Secrets loaded exclusively from environment variables (<code>NEXTAUTH_SECRET</code>, <code>AUTH_SECRET</code>).", bullet_style))
    story.append(Paragraph("• <b>SQL Injection Prevention:</b> Prisma ORM utilizes parameterized SQL queries across all Postgres operations.", bullet_style))
    story.append(Paragraph("• <b>Safe JSON & Error Handling:</b> All dynamic JSON parsing is encapsulated in defensive try/catch blocks to eliminate SSR rendering crashes.", bullet_style))
    story.append(Paragraph("• <b>Automated Cache Invalidation:</b> Every write operation triggers targeted <code>revalidatePath()</code> calls across all public consumer paths.", bullet_style))

    story.append(Spacer(1, 14))

    # ═════════════════════════════════════════════════════════════════
    # 8. PRODUCTION DEPLOYMENT & MAINTENANCE
    # ═════════════════════════════════════════════════════════════════
    story.append(Paragraph("7. Production Deployment & Verification", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_brand, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("<b>Build Verification & Health Status:</b>", body_style))
    story.append(Paragraph("• <code>npx tsc --noEmit</code>: <b>0 errors</b> (Strict TypeScript validation passed across all components, actions, and API routes).", bullet_style))
    story.append(Paragraph("• <code>npm run build</code>: <b>0 errors</b> (All 27 static and dynamic routes compiled, prerendered, and bundled into optimized production artifacts).", bullet_style))
    story.append(Paragraph("• <b>Git Repository:</b> Pushed to branch <code>main</code> at <code>github.com/QuantumAI/Quantum_AI</code>.", bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generated successfully at: {output_path}")

if __name__ == "__main__":
    out_file = "Quantum_AI_Website_Documentation.pdf"
    if len(sys.argv) > 1:
        out_file = sys.argv[1]
    create_quantum_pdf(out_file)
