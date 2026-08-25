'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function createLeadershipMember(data: {
  name: string;
  slug?: string;
  publicId?: string;
  position: string;
  roleType?: string;
  customRole?: string | null;
  department?: string | null;
  shortBio: string;
  fullBio?: string | null;
  photo?: string | null;
  email?: string | null;
  linkedin?: string | null;
  website?: string | null;
  location?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}) {
  await checkAuth();

  const slug = data.slug
    ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
    : data.name.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');

  const count = await prisma.leadership.count();
  const publicId = data.publicId || `QA-${String(count + 1).padStart(3, '0')}`;

  const member = await prisma.leadership.create({
    data: {
      publicId,
      slug: slug || `leader-${Date.now().toString(36)}`,
      name: data.name.trim(),
      position: data.position.trim(),
      roleType: data.roleType || 'PREDEFINED',
      customRole: data.customRole?.trim() || null,
      department: data.department?.trim() || null,
      shortBio: data.shortBio.trim(),
      fullBio: data.fullBio?.trim() || null,
      photo: data.photo || null,
      email: data.email?.trim() || null,
      linkedin: data.linkedin?.trim() || null,
      website: data.website?.trim() || null,
      location: data.location?.trim() || 'Pakistan',
      displayOrder: Number(data.displayOrder) || count,
      isActive: data.isActive ?? true,
    },
  });

  revalidatePath('/admin/leadership');
  revalidatePath('/leadership');
  revalidatePath(`/leadership/${member.slug}`);
  revalidatePath('/team');
  revalidatePath('/about');
  revalidatePath('/');
  return member;
}

export async function updateLeadershipMember(
  id: string,
  data: {
    name?: string;
    slug?: string;
    publicId?: string;
    position?: string;
    roleType?: string;
    customRole?: string | null;
    department?: string | null;
    shortBio?: string;
    fullBio?: string | null;
    photo?: string | null;
    email?: string | null;
    linkedin?: string | null;
    website?: string | null;
    location?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }
) {
  await checkAuth();

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.slug !== undefined) {
    updateData.slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (data.publicId !== undefined) updateData.publicId = data.publicId.trim();
  if (data.position !== undefined) updateData.position = data.position.trim();
  if (data.roleType !== undefined) updateData.roleType = data.roleType;
  if (data.customRole !== undefined) updateData.customRole = data.customRole?.trim() || null;
  if (data.department !== undefined) updateData.department = data.department?.trim() || null;
  if (data.shortBio !== undefined) updateData.shortBio = data.shortBio.trim();
  if (data.fullBio !== undefined) updateData.fullBio = data.fullBio?.trim() || null;
  if (data.photo !== undefined) updateData.photo = data.photo || null;
  if (data.email !== undefined) updateData.email = data.email?.trim() || null;
  if (data.linkedin !== undefined) updateData.linkedin = data.linkedin?.trim() || null;
  if (data.website !== undefined) updateData.website = data.website?.trim() || null;
  if (data.location !== undefined) updateData.location = data.location?.trim() || null;
  if (data.displayOrder !== undefined) updateData.displayOrder = Number(data.displayOrder);
  if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

  const member = await prisma.leadership.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/admin/leadership');
  revalidatePath('/leadership');
  revalidatePath(`/leadership/${member.slug}`);
  revalidatePath('/team');
  revalidatePath('/about');
  revalidatePath('/');
  return member;
}

export async function reorderLeadershipMembers(orderedIds: string[]) {
  await checkAuth();

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.leadership.update({
        where: { id },
        data: { displayOrder: index + 1 },
      })
    )
  );

  revalidatePath('/admin/leadership');
  revalidatePath('/leadership');
  revalidatePath('/team');
  revalidatePath('/about');
  revalidatePath('/');
  return { success: true };
}

export async function deleteLeadershipMember(id: string) {
  await checkAuth();

  await prisma.leadership.delete({ where: { id } });

  revalidatePath('/admin/leadership');
  revalidatePath('/leadership');
  revalidatePath('/team');
  revalidatePath('/about');
  revalidatePath('/');
  return { success: true };
}
