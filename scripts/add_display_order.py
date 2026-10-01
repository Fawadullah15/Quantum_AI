import re

with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# Add displayOrder to CareerApplication
content = content.replace(
    'assignedTo        String?\n    notes             SubmissionNote[]\n    createdAt         DateTime         @default(now())',
    'assignedTo        String?\n    displayOrder      Int              @default(100)\n    notes             SubmissionNote[]\n    createdAt         DateTime         @default(now())'
)

with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
