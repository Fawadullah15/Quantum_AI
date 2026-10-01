import re

with open('app/(public)/leadership/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_css = """          .prof-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem;
          }"""
          
good_css = """          .prof-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem;
          }
          .prof-portrait-col { order: 1 !important; }
          .prof-main-col { order: 2 !important; }
          .prof-social-col { order: 3 !important; margin-top: 1rem !important; }"""
          
content = content.replace(bad_css, good_css)

with open('app/(public)/leadership/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
