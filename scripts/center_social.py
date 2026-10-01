import re

file_path = 'app/(public)/leadership/[slug]/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '.prof-social-list {\n              flex-direction: row !important;\n              flex-wrap: wrap;\n              gap: 1rem !important;\n            }',
    '.prof-social-list {\n              flex-direction: row !important;\n              flex-wrap: wrap;\n              gap: 1rem !important;\n              justify-content: center !important;\n            }'
)
content = content.replace(
    '.prof-social-col { order: 2 !important; margin-top: 0.75rem !important; margin-bottom: 0.75rem !important; justify-content: center; }',
    '.prof-social-col { order: 2 !important; margin-top: 0.75rem !important; margin-bottom: 0.75rem !important; }'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
