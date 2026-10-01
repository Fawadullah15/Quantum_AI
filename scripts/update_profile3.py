import re

with open('app/(public)/leadership/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the CSS for Grid layout on Desktop
css_old = """        .prof-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: start;
        }"""
css_new = """        .prof-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          grid-template-areas: 
            "portrait main"
            "social main";
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: start;
        }
        .prof-portrait-col { grid-area: portrait; }
        .prof-main-col { grid-area: main; display: flex; flex-direction: column; gap: 1.5rem; }
        .prof-social-col { grid-area: social; }"""
content = content.replace(css_old, css_new)

# Clean up prof-main
css_prof_main_old = """        .prof-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }"""
css_prof_main_new = """        .prof-main {
          /* replaced by prof-main-col */
        }"""
content = content.replace(css_prof_main_old, css_prof_main_new)

# Remove the old mobile media query completely to prevent conflicts
bad_css = """        @media (max-width: 820px) {
          .prof-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .prof-photo-box {
            max-width: 280px;
          }
        }"""
content = content.replace(bad_css, "")

# 2. Add Mobile CSS overrides for full-width portrait and circular CTAs
mobile_css = """
        @media (max-width: 820px) {
          .prof-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem;
          }
          .prof-portrait-col { order: 1 !important; }
          .prof-main-col { order: 2 !important; }
          .prof-social-col { order: 3 !important; margin-top: 1rem !important; }
          .prof-photo-box {
            max-width: 100% !important;
            aspect-ratio: 1 / 1.1 !important;
            border-radius: 12px !important;
            border: 1px solid rgba(22, 119, 255, 0.25) !important;
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5) !important;
            margin-bottom: 0 !important;
          }
          .prof-photo-box::before {
            content: '';
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 40%;
            background: linear-gradient(to top, rgba(3, 7, 18, 0.95) 0%, rgba(3, 7, 18, 0) 100%);
            pointer-events: none;
            z-index: 1;
          }
          .prof-photo-img {
            object-fit: cover !important;
            object-position: center 15% !important;
            z-index: 0;
          }
          .prof-social-col {
            width: 100%;
            margin-top: 0.5rem;
          }
          .prof-social-list {
            flex-direction: row !important;
            flex-wrap: wrap;
            gap: 1rem !important;
          }
          .prof-social-btn {
            width: 48px !important;
            height: 48px !important;
            border-radius: 50% !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          }
          .prof-social-btn svg {
            width: 20px !important;
            height: 20px !important;
            margin: 0 !important;
          }
          .prof-social-text {
            display: none !important;
          }
        }
      `}</style>"""
content = content.replace("      `}</style>", mobile_css)

# 3. Rewrite JSX structure safely using regex
# Replace `<div className="prof-grid">\n          <div>` with `<div className="prof-grid">\n          <div className="prof-portrait-col">`
content = re.sub(r'<div className="prof-grid">\s*\{\/\* Left Column: Portrait & Connect \*\/\}\s*<div>', r'<div className="prof-grid">\n          <div className="prof-portrait-col">', content)

# Replace `<div className="prof-social-list">` with `</div>\n          <div className="prof-social-col">\n            <div className="prof-social-list">`
content = content.replace('            <div className="prof-social-list">', '          </div>\n          <div className="prof-social-col">\n            <div className="prof-social-list">')

# We don't need to add a closing div before prof-main-col, because the original DOM had:
# </div> (closes prof-social-list)
# </div> (closes left column div - which is now prof-social-col)
# <div className="prof-main">
# So we simply replace `<div className="prof-main">` with `<div className="prof-main-col">`
content = content.replace('{/* Right Column: Details & Bio */}\n          <div className="prof-main">', '{/* Right Column: Details & Bio */}\n          <div className="prof-main-col">')


# Wrap text with regex to ensure it only captures the text inside the <a> tag after SVG
# LinkedIn
content = re.sub(r'(<svg.*?</svg>)\s*(LinkedIn Profile ?)\s*</a>', r'\1\n                  <span className="prof-social-text">\2</span>\n                </a>', content, flags=re.DOTALL)
# GitHub
content = re.sub(r'(<svg.*?</svg>)\s*(GitHub Profile ?)\s*</a>', r'\1\n                  <span className="prof-social-text">\2</span>\n                </a>', content, flags=re.DOTALL)
# Email
content = re.sub(r'(<svg.*?</svg>)\s*(\{m\.email\})\s*</a>', r'\1\n                  <span className="prof-social-text">\2</span>\n                </a>', content, flags=re.DOTALL)
# Website
content = re.sub(r'(<svg.*?</svg>)\s*(Personal Website ?)\s*</a>', r'\1\n                  <span className="prof-social-text">\2</span>\n                </a>', content, flags=re.DOTALL)


with open('app/(public)/leadership/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
