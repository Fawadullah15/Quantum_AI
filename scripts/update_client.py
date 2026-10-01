import re

with open('app/admin/(dashboard)/leadership/client.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix reorder backend call
old_call = """      try {
        const dbOnlyIds = reorderedItems
          .filter((item) => !(item as any).isApplication)
          .map((item) => item.id);
        await reorderLeadershipMembers(dbOnlyIds);
        toast.success("""

new_call = """      try {
        const payload = reorderedItems.map((item) => ({
          id: item.id,
          isApp: !!(item as any).isApplication
        }));
        await reorderLeadershipMembers(payload);
        toast.success("""

content = content.replace(old_call, new_call)

# Fix upDisabled / downDisabled logic
old_disabled = """                            {(() => {
                              const isApp = (member as any).isApplication;
                              const memberIdx = members.findIndex((m) => m.id === member.id);
                              const isFirst = memberIdx <= 0;
                              const isLast = memberIdx === -1 || memberIdx >= members.length - 1;
                              const orderNumber = memberIdx !== -1 ? memberIdx + 1 : index + 1;
                              const upDisabled = isFirst || isReordering || isApp;
                              const downDisabled = isLast || isReordering || isApp;"""

new_disabled = """                            {(() => {
                              const isApp = (member as any).isApplication;
                              const memberIdx = members.findIndex((m) => m.id === member.id);
                              const isFirst = memberIdx <= 0;
                              const isLast = memberIdx === -1 || memberIdx >= members.length - 1;
                              const orderNumber = memberIdx !== -1 ? memberIdx + 1 : index + 1;
                              const upDisabled = isFirst || isReordering;
                              const downDisabled = isLast || isReordering;"""

content = content.replace(old_disabled, new_disabled)

with open('app/admin/(dashboard)/leadership/client.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
