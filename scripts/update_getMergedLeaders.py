import re

with open('lib/getMergedLeaders.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'displayOrder: 100,',
    'displayOrder: app.displayOrder ?? 100,'
)

with open('lib/getMergedLeaders.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
