import re

with open('app/(public)/leadership/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any text content inside the <a> tag (after the SVG) with <span className="prof-social-text">...</span>
# The structure is:
# <a ...>
#   <svg ...>...</svg>
#   Some Text Here
# </a>

def wrap_text(match):
    prefix = match.group(1)
    text = match.group(2).strip()
    # Don't wrap if it's already wrapped
    if 'prof-social-text' in text:
        return match.group(0)
    return f'{prefix}\n                  <span className="prof-social-text">{text}</span>\n                </a>'

content = re.sub(r'(<svg.*?</svg>)\s*([^<]+?)\s*</a>', wrap_text, content, flags=re.DOTALL)

with open('app/(public)/leadership/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
