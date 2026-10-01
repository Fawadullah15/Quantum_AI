import re

with open('app/admin/(dashboard)/leadership/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old_action = """export async function reorderLeadershipMembers(orderedIds: string[]) {
  await checkAuth();

  // Use a transaction to swap all displayOrder values atomically
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.leadership.update({
        where: { id },
        data: { displayOrder: index + 1 },
      })
    )
  );

  // Revalidate all affected paths
  revalidatePath('/admin/leadership');
  revalidatePath('/leadership');
  revalidatePath('/team');
  revalidatePath('/about');
  revalidatePath('/');

  // Also revalidate individual member detail pages
  const members = await prisma.leadership.findMany({
    where: { id: { in: orderedIds } },
    select: { slug: true },
  });
  for (const m of members) {
    revalidatePath(`/leadership/${m.slug}`);
  }

  return { success: true };
}"""

new_action = """export async function reorderLeadershipMembers(orderedItems: { id: string; isApp?: boolean }[]) {
  await checkAuth();

  // Use a transaction to swap all displayOrder values atomically across both tables
  const updates = orderedItems.map((item, index) => {
    if (item.isApp) {
      return prisma.careerApplication.update({
        where: { id: item.id },
        data: { displayOrder: index + 1 },
      });
    } else {
      return prisma.leadership.update({
        where: { id: item.id },
        data: { displayOrder: index + 1 },
      });
    }
  });
  
  await prisma.$transaction(updates);

  // Revalidate all affected paths
  revalidatePath('/admin/leadership');
  revalidatePath('/leadership');
  revalidatePath('/team');
  revalidatePath('/about');
  revalidatePath('/');

  // Also revalidate individual member detail pages
  const nativeIds = orderedItems.filter(i => !i.isApp).map(i => i.id);
  const members = await prisma.leadership.findMany({
    where: { id: { in: nativeIds } },
    select: { slug: true },
  });
  for (const m of members) {
    revalidatePath(`/leadership/${m.slug}`);
  }

  return { success: true };
}"""

content = content.replace(old_action, new_action)

with open('app/admin/(dashboard)/leadership/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
