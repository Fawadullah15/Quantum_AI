import re

with open('app/(public)/leadership/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_css = """          .prof-photo-img {
              object-fit: cover !important;
              object-position: center 15% !important;
            }"""
            
good_css = """          .prof-photo-box::before {
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
            }"""

content = content.replace(bad_css, good_css)

with open('app/(public)/leadership/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
