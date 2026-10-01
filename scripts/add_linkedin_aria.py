import re

with open('app/(public)/leadership/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'rel="noopener noreferrer" className="prof-social-btn"\s*>\s*<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">',
    r'rel="noopener noreferrer" className="prof-social-btn" aria-label={`View ${m.name}\'s LinkedIn profile`} title="LinkedIn Profile">\n                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">',
    content
)

with open('app/(public)/leadership/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
