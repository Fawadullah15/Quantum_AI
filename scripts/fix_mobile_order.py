import re

file_path = 'app/(public)/leadership/[slug]/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace mobile ordering
content = content.replace(
    '.prof-main-col { order: 2 !important; }',
    '.prof-main-col { order: 3 !important; }'
)
content = content.replace(
    '.prof-social-col { order: 3 !important; margin-top: 1rem !important; }',
    '.prof-social-col { order: 2 !important; margin-top: 0.75rem !important; margin-bottom: 0.75rem !important; justify-content: center; }'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
