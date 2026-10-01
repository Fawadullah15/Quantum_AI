import re

with open('app/(public)/leadership/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

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

with open('app/(public)/leadership/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
