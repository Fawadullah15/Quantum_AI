import re

with open('styles/globals.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change body font-family
content = re.sub(
    r'(body\s*\{[\s\S]*?)font-family:\s*var\(--font-sans\);',
    r'\1font-family: var(--font-d-din), Roboto, Arial, sans-serif;',
    content,
    count=1
)

# 2. Add h4, h5, h6 block if not exists
if 'h4, h5, h6' not in content:
    append_css = """

/* Additional protection for smaller headings */
.public-layout h4, .public-layout h5, .public-layout h6 {
  font-family: var(--font-sans);
}
"""
    content += append_css

with open('styles/globals.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
