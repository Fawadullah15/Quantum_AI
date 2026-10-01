import re

with open('app/admin/(dashboard)/leadership/client.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix reorder backend call
content = re.sub(
    r'const dbOnlyIds = reorderedItems\s*\n\s*\.filter\(\(item\) => !\(item as any\)\.isApplication\)\s*\n\s*\.map\(\(item\) => item\.id\);\s*\n\s*await reorderLeadershipMembers\(dbOnlyIds\);',
    r'const payload = reorderedItems.map((item) => ({ id: item.id, isApp: !!(item as any).isApplication }));\n        await reorderLeadershipMembers(payload);',
    content
)

# Fix upDisabled / downDisabled logic
content = re.sub(
    r'const upDisabled = isFirst \|\| isReordering \|\| isApp;\s*\n\s*const downDisabled = isLast \|\| isReordering \|\| isApp;',
    r'const upDisabled = isFirst || isReordering;\n                              const downDisabled = isLast || isReordering;',
    content
)

with open('app/admin/(dashboard)/leadership/client.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
