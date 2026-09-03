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

export async function updateSubmissionStatus(type: 'PARTNERSHIP' | 'CAREER', id: string, status: string) {
  await checkAuth();

  if (type === 'PARTNERSHIP') {
    await prisma.partnershipRequest.update({
      where: { id },
      data: { status },
    });
  } else {
    // Fetch the existing application to check its current state and get data
    const app = await prisma.careerApplication.findUnique({ where: { id } });
    if (!app) throw new Error('Application not found');

    // Update the application status
    await prisma.careerApplication.update({
      where: { id },
      data: { status },
    });

    // Handle Leadership Automation
    if (status === 'ACCEPTED' && app.status !== 'ACCEPTED') {
      // Create Leadership record if it doesn't exist
      const existing = await prisma.leadership.findUnique({ where: { publicId: app.referenceId } });
      if (!existing) {
        const baseSlug = app.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const slug = `${baseSlug}-${app.referenceId.toLowerCase()}`;
        
        await prisma.leadership.create({
          data: {
            publicId: app.referenceId,
            slug: slug,
            name: app.fullName,
            position: app.position,
            department: 'Team Member',
            shortBio: app.introduction || 'Team Member at Quantum AI',
            fullBio: app.whyQuantumAI || app.skills || '',
            photo: app.photoUrl,
            linkedin: app.linkedinUrl,
            github: app.githubUrl,
            website: app.portfolioUrl,
            location: app.currentLocation,
            displayOrder: 100,
            isActive: true,
          }
        });
      }
    } else if (status !== 'ACCEPTED' && app.status === 'ACCEPTED') {
      // Remove from Leadership if status is changed from ACCEPTED to something else
      await prisma.leadership.deleteMany({
        where: { publicId: app.referenceId }
      });
    }
  }

  revalidatePath('/admin/careers-partnerships');
  revalidatePath(`/admin/careers-partnerships/${type.toLowerCase()}/${id}`);
  
  if (type === 'CAREER') {
    revalidatePath('/admin/leadership');
    revalidatePath('/leadership');
    revalidatePath('/leadership/[slug]', 'page');
  }

  return { success: true };
}

export async function assignSubmission(type: 'PARTNERSHIP' | 'CAREER', id: string, assignedTo: string) {
  await checkAuth();

  if (type === 'PARTNERSHIP') {
    await prisma.partnershipRequest.update({
      where: { id },
      data: { assignedTo },
    });
  } else {
    await prisma.careerApplication.update({
      where: { id },
      data: { assignedTo },
    });
  }

  revalidatePath('/admin/careers-partnerships');
  revalidatePath(`/admin/careers-partnerships/${type.toLowerCase()}/${id}`);
  return { success: true };
}

export async function addSubmissionNote(type: 'PARTNERSHIP' | 'CAREER', id: string, content: string) {
  const session = await checkAuth();

  const authorName = session.user?.name || 'Administrator';
  const authorEmail = session.user?.email || 'admin@quantumai.dev';

  if (!content.trim()) throw new Error('Note content cannot be empty');

  if (type === 'PARTNERSHIP') {
    await prisma.submissionNote.create({
      data: {
        partnershipRequestId: id,
        authorName,
        authorEmail,
        content: content.trim(),
      },
    });
  } else {
    await prisma.submissionNote.create({
      data: {
        careerApplicationId: id,
        authorName,
        authorEmail,
        content: content.trim(),
      },
    });
  }

  revalidatePath(`/admin/careers-partnerships/${type.toLowerCase()}/${id}`);
  return { success: true };
}

export async function deleteSubmission(type: 'PARTNERSHIP' | 'CAREER', id: string) {
  await checkAuth();

  if (type === 'PARTNERSHIP') {
    await prisma.partnershipRequest.delete({ where: { id } });
  } else {
    await prisma.careerApplication.delete({ where: { id } });
  }

  revalidatePath('/admin/careers-partnerships');
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// CAREER POSITIONS (JOB OPENINGS CATALOG)
// ─────────────────────────────────────────────────────────────

export async function createCareerPosition(data: {
  title: string;
  department?: string;
  location?: string;
  workType?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}) {
  await checkAuth();

  const pos = await prisma.careerPosition.create({
    data: {
      title: data.title.trim(),
      department: data.department || 'AI Engineering',
      location: data.location || 'Remote / Hybrid',
      workType: data.workType || 'Full Time',
      description: data.description || null,
      isActive: data.isActive ?? true,
      order: Number(data.order) || 0,
    },
  });

  revalidatePath('/careers');
  revalidatePath('/admin/careers-partnerships');
  return pos;
}

export async function updateCareerPosition(
  id: string,
  data: {
    title: string;
    department?: string;
    location?: string;
    workType?: string;
    description?: string;
    isActive?: boolean;
    order?: number;
  }
) {
  await checkAuth();

  const pos = await prisma.careerPosition.update({
    where: { id },
    data: {
      title: data.title.trim(),
      department: data.department || 'AI Engineering',
      location: data.location || 'Remote / Hybrid',
      workType: data.workType || 'Full Time',
      description: data.description || null,
      isActive: Boolean(data.isActive),
      order: Number(data.order) || 0,
    },
  });

  revalidatePath('/careers');
  revalidatePath('/admin/careers-partnerships');
  return pos;
}

export async function deleteCareerPosition(id: string) {
  await checkAuth();

  await prisma.careerPosition.delete({ where: { id } });

  revalidatePath('/careers');
  revalidatePath('/admin/careers-partnerships');
  return { success: true };
}
