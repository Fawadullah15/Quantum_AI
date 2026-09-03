
import prisma from '@/lib/db';

export async function getMergedLeaders() {
  const dbMembers = await prisma.leadership.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  }).catch(() => []);

  const acceptedApps = await prisma.careerApplication.findMany({
    where: { status: 'ACCEPTED' },
    orderBy: { createdAt: 'asc' }
  }).catch(() => []);

  const appMembers = acceptedApps.map((app: any) => {
    // Generate a unique slug from name and reference ID to prevent duplicates
    const baseSlug = app.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${app.referenceId.toLowerCase()}`;
    
    return {
      id: app.id,
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
    };
  });

  return { dbMembers, appMembers };
}
