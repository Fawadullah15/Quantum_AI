import re

with open('app/(public)/leadership/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the CSS
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

# Update the prof-main class to not have the flex logic since it's on prof-main-col
css_prof_main_old = """        .prof-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }"""
css_prof_main_new = """        .prof-main {
          /* replaced by prof-main-col */
        }"""
content = content.replace(css_prof_main_old, css_prof_main_new)

# 2. Add Mobile CSS overrides
mobile_css = """
        @media (max-width: 820px) {
          .prof-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem;
          }
          .prof-photo-box {
            max-width: 100% !important;
            aspect-ratio: 1 / 1.1 !important;
            border-radius: 12px !important;
            border: 1px solid rgba(22, 119, 255, 0.25) !important;
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5) !important;
            margin-bottom: 0 !important;
          }
          .prof-photo-img {
            object-fit: cover !important;
            object-position: center 15% !important;
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

# 3. Rewrite JSX structure safely
content = content.replace("""        <div className="prof-grid">
          {/* Left Column: Portrait & Connect */}
          <div>""", """        <div className="prof-grid">
          <div className="prof-portrait-col">""")

content = content.replace("""            <div className="prof-social-list">""", """          </div>
          <div className="prof-social-col">
            <div className="prof-social-list">""")

content = content.replace("""          {/* Right Column: Details & Bio */}
          <div className="prof-main">""", """          </div>
          <div className="prof-main-col">""")

# Wrap text with regex to ensure it only captures the text inside the <a> tag after SVG
import re
# LinkedIn
content = re.sub(r'(<svg.*?</svg>)\s*(LinkedIn Profile .*?)\s*</a>', r'\1\n                  <span className="prof-social-text">\2</span>\n                </a>', content, flags=re.DOTALL)
# GitHub
content = re.sub(r'(<svg.*?</svg>)\s*(GitHub Profile .*?)\s*</a>', r'\1\n                  <span className="prof-social-text">\2</span>\n                </a>', content, flags=re.DOTALL)
# Email
content = re.sub(r'(<svg.*?</svg>)\s*(\{m\.email\})\s*</a>', r'\1\n                  <span className="prof-social-text">\2</span>\n                </a>', content, flags=re.DOTALL)
# Website
content = re.sub(r'(<svg.*?</svg>)\s*(Personal Website .*?)\s*</a>', r'\1\n                  <span className="prof-social-text">\2</span>\n                </a>', content, flags=re.DOTALL)

with open('app/(public)/leadership/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
