import sys

with open('components/layout/Footer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    """fontWeight: 400,\n                fontFamily: 'var(--font-sans)',""",
    """fontWeight: 400,\n                fontFamily: 'var(--font-d-din)',"""
)
with open('components/layout/Footer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
