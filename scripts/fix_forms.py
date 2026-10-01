import re

with open('styles/globals.css', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'font-family: var(--font-sans, sans-serif);',
    'font-family: var(--font-d-din, sans-serif);'
)

with open('styles/globals.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
