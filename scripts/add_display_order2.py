import re

with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# Add displayOrder to CareerApplication
content = re.sub(
    r'(model CareerApplication\s*\{[\s\S]*?)(\s*assignedTo\s*String\?[\s\S]*?\})',
    r'\1\n  displayOrder      Int              @default(100)\2',
    content
)

with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
