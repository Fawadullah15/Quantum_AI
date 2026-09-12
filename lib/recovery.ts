import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { del } from '@vercel/blob';

export type EntityType =
  | 'CASE_STUDY'
  | 'PRODUCT'
  | 'LEADERSHIP'
  | 'TESTIMONIAL'
  | 'SERVICE'
  | 'TECHNOLOGY'
  | 'BLOG_POST'
  | 'CLIENT'
  | 'CAREER_APPLICATION'
  | 'PARTNERSHIP_REQUEST'
  | 'CAREER_POSITION'
  | 'CONTACT_SUBMISSION'
  | 'MEDIA'
  | 'NOTIFICATION'
  | 'TEAM_MEMBER'
  | 'FOUNDER';

export interface AdminUserInfo {
  id?: string;
  name?: string | null;
  email?: string | null;
}

export interface SoftDeleteOptions {
  entityType: EntityType;
  id: string;
  adminUser?: AdminUserInfo;
}

export interface RestoreOptions {
  id: string;
  adminUser?: AdminUserInfo;
}

export interface PermanentDeleteOptions {
  id: string;
  adminUser?: AdminUserInfo;
}

export interface GetDeletedItemsOptions {
  filter?: string;
  section?: string;
  search?: string;
  dateRange?: string; // 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS'
  sortBy?: 'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC';
  page?: number;
  limit?: number;
}

// Map entity type to friendly section names
const SECTION_MAP: Record<EntityType, string> = {
  CASE_STUDY: 'Works & Case Studies',
  PRODUCT: 'Products',
  LEADERSHIP: 'Leadership & Team',
  TESTIMONIAL: 'Testimonials',
  SERVICE: 'Services',
  TECHNOLOGY: 'Technology Stack',
  BLOG_POST: 'Blog Articles',
  CLIENT: 'Clients / Worked With',
  CAREER_APPLICATION: 'Careers & Applications',
  PARTNERSHIP_REQUEST: 'Partnerships',
  CAREER_POSITION: 'Career Openings',
  CONTACT_SUBMISSION: 'Contact Messages',
  MEDIA: 'Media Library',
  NOTIFICATION: 'Website Notifications',
  TEAM_MEMBER: 'Leadership & Team',
  FOUNDER: 'Leadership & Team',
};

// Extract associated media URLs from any entity snapshot
function extractMediaUrls(data: any): string[] {
  const urls = new Set<string>();

  const check = (val: any) => {
    if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'))) {
      if (val.match(/\.(png|jpe?g|webp|gif|svg|mp4|webm|pdf|docs?)$/i) || val.includes('blob.vercel-storage.com')) {
        urls.add(val);
      }
    }
  };

  if (!data || typeof data !== 'object') return [];

  // Direct fields
  ['heroImage', 'photo', 'photoUrl', 'coverImage', 'logo', 'icon', 'url', 'resumeUrl', 'additionalDocsUrl', 'attachmentUrl'].forEach((k) => {
    if (data[k]) check(data[k]);
  });

  // Gallery array or string
  if (data.gallery) {
    if (Array.isArray(data.gallery)) {
      data.gallery.forEach(check);
    } else if (typeof data.gallery === 'string') {
      try {
        const parsed = JSON.parse(data.gallery);
        if (Array.isArray(parsed)) parsed.forEach(check);
      } catch {
        check(data.gallery);
      }
    }
  }

  return Array.from(urls);
}

/**
 * Revalidate all paths related to an entity
 */
function revalidateEntityPaths(entityType: EntityType, originalSlug?: string | null) {
  revalidatePath('/admin/recently-deleted');
  revalidatePath('/admin');

  switch (entityType) {
    case 'CASE_STUDY':
      revalidatePath('/admin/case-studies');
      revalidatePath('/work');
      revalidatePath('/case-studies');
      if (originalSlug) {
        revalidatePath(`/work/${originalSlug}`);
        revalidatePath(`/case-studies/${originalSlug}`);
      }
      revalidatePath('/');
      break;
    case 'PRODUCT':
      revalidatePath('/admin/products');
      revalidatePath('/products');
      if (originalSlug) revalidatePath(`/products/${originalSlug}`);
      revalidatePath('/');
      break;
    case 'LEADERSHIP':
    case 'TEAM_MEMBER':
    case 'FOUNDER':
      revalidatePath('/admin/leadership');
      revalidatePath('/leadership');
      revalidatePath('/team');
      revalidatePath('/about');
      if (originalSlug) revalidatePath(`/leadership/${originalSlug}`);
      revalidatePath('/');
      break;
    case 'TESTIMONIAL':
      revalidatePath('/admin/testimonials');
      revalidatePath('/');
      break;
    case 'SERVICE':
      revalidatePath('/admin/services');
      revalidatePath('/services');
      revalidatePath('/systems');
      revalidatePath('/');
      break;
    case 'TECHNOLOGY':
      revalidatePath('/admin/technology');
      revalidatePath('/technology');
      if (originalSlug) revalidatePath(`/technologies/${originalSlug}`);
      revalidatePath('/');
      break;
    case 'BLOG_POST':
      revalidatePath('/admin/blog');
      revalidatePath('/blog');
      revalidatePath('/insights');
      if (originalSlug) revalidatePath(`/blog/${originalSlug}`);
      revalidatePath('/');
      break;
    case 'CLIENT':
      revalidatePath('/admin/clients');
      revalidatePath('/');
      break;
    case 'CAREER_APPLICATION':
    case 'PARTNERSHIP_REQUEST':
    case 'CAREER_POSITION':
      revalidatePath('/admin/careers-partnerships');
      revalidatePath('/careers');
      break;
    case 'CONTACT_SUBMISSION':
      revalidatePath('/admin/messages');
      break;
    case 'MEDIA':
      revalidatePath('/admin/media');
      break;
    case 'NOTIFICATION':
      revalidatePath('/api/admin/notifications');
      break;
  }
}

/**
 * Soft Delete an entity and move to Recently Deleted
 */
export async function softDelete({ entityType, id, adminUser }: SoftDeleteOptions) {
  let record: any = null;
  let title = 'Deleted Item';
  let subtitle: string | null = null;
  let originalSlug: string | null = null;

  // 1. Fetch record with complete relations
  switch (entityType) {
    case 'CASE_STUDY':
      record = await prisma.caseStudy.findUnique({
        where: { id },
        include: { metrics: true },
      });
      if (record) {
        title = record.title;
        subtitle = `${record.client || 'Client'} • /work/${record.slug}`;
        originalSlug = record.slug;
      }
      break;

    case 'PRODUCT':
      record = await prisma.product.findUnique({
        where: { id },
        include: { features: true },
      });
      if (record) {
        title = record.name;
        subtitle = `${record.category || 'Product'} • /products/${record.slug}`;
        originalSlug = record.slug;
      }
      break;

    case 'LEADERSHIP':
      record = await prisma.leadership.findUnique({ where: { id } });
      if (record) {
        title = record.name;
        subtitle = `${record.position || 'Leadership'} • ${record.publicId || ''}`;
        originalSlug = record.slug;
      }
      break;

    case 'TESTIMONIAL':
      record = await prisma.testimonial.findUnique({ where: { id } });
      if (record) {
        title = record.name;
        subtitle = `${record.role || 'Client'} at ${record.company || 'Enterprise'}`;
      }
      break;

    case 'SERVICE':
      record = await prisma.service.findUnique({ where: { id } });
      if (record) {
        title = record.name;
        subtitle = record.category || 'Service';
      }
      break;

    case 'TECHNOLOGY':
      record = await prisma.technology.findUnique({ where: { id } });
      if (record) {
        title = record.name;
        subtitle = record.category || 'Tech Stack';
        originalSlug = record.slug;
      }
      break;

    case 'BLOG_POST':
      record = await prisma.blogPost.findUnique({ where: { id } });
      if (record) {
        title = record.title;
        subtitle = `By ${record.author || 'Research Team'} • ${record.category || ''}`;
        originalSlug = record.slug;
      }
      break;

    case 'CLIENT':
      record = await prisma.client.findUnique({ where: { id } });
      if (record) {
        title = record.name;
        subtitle = record.industry || 'Client';
        originalSlug = record.slug;
      }
      break;

    case 'CAREER_APPLICATION':
      record = await prisma.careerApplication.findUnique({
        where: { id },
        include: { notes: true },
      });
      if (record) {
        title = record.fullName;
        subtitle = `${record.position} • Ref: ${record.referenceId}`;
        originalSlug = record.referenceId;
      }
      break;

    case 'PARTNERSHIP_REQUEST':
      record = await prisma.partnershipRequest.findUnique({
        where: { id },
        include: { notes: true },
      });
      if (record) {
        title = record.fullName || record.company || 'Partnership Request';
        subtitle = `${record.partnershipType} • Ref: ${record.referenceId}`;
        originalSlug = record.referenceId;
      }
      break;

    case 'CAREER_POSITION':
      record = await prisma.careerPosition.findUnique({ where: { id } });
      if (record) {
        title = record.title;
        subtitle = `${record.department} • ${record.location}`;
      }
      break;

    case 'CONTACT_SUBMISSION':
      record = await prisma.contactSubmission.findUnique({ where: { id } });
      if (record) {
        title = record.name;
        subtitle = `${record.email} • ${record.company || 'Inquiry'}`;
      }
      break;

    case 'MEDIA':
      record = await prisma.media.findUnique({ where: { id } });
      if (record) {
        title = record.filename;
        subtitle = `${record.type} • ${(record.size / 1024).toFixed(1)} KB`;
      }
      break;

    case 'NOTIFICATION':
      record = await prisma.notification.findUnique({ where: { id } });
      if (record) {
        title = record.title;
        subtitle = `${record.type} • ${record.senderEmail || ''}`;
      }
      break;

    case 'TEAM_MEMBER':
      record = await prisma.teamMember.findUnique({ where: { id } });
      if (record) {
        title = record.name;
        subtitle = record.role || 'Team Member';
      }
      break;

    case 'FOUNDER':
      record = await prisma.founder.findUnique({ where: { id } });
      if (record) {
        title = record.name;
        subtitle = record.role || 'Founder';
      }
      break;
  }

  if (!record) {
    throw new Error(`Record not found for entity "${entityType}" with ID "${id}"`);
  }

  const mediaUrls = extractMediaUrls(record);
  const originalSection = SECTION_MAP[entityType] || 'General Content';

  // 2. Insert into RecentlyDeleted
  const deletedItem = await prisma.recentlyDeleted.create({
    data: {
      entityType,
      originalId: id,
      title,
      subtitle,
      originalSection,
      adminEmail: adminUser?.email || null,
      adminName: adminUser?.name || null,
      data: JSON.stringify(record),
      mediaUrls: JSON.stringify(mediaUrls),
      originalSlug,
      status: 'DELETED',
    },
  });

  // 3. Log Activity
  await prisma.activityLog.create({
    data: {
      userId: adminUser?.id || null,
      adminName: adminUser?.name || 'Administrator',
      adminEmail: adminUser?.email || null,
      action: 'SOFT_DELETE',
      entity: entityType,
      entityId: id,
      entityName: title,
      details: `Moved "${title}" (${originalSection}) to Recently Deleted.`,
    },
  }).catch(() => {});

  // 4. Delete from active table
  // NOTE: Cascade handles child tables in Prisma schema.
  // For MEDIA, do NOT call del() on Vercel blob storage so the file is preserved for recovery!
  switch (entityType) {
    case 'CASE_STUDY':
      await prisma.caseStudy.delete({ where: { id } });
      break;
    case 'PRODUCT':
      await prisma.product.delete({ where: { id } });
      break;
    case 'LEADERSHIP':
      await prisma.leadership.delete({ where: { id } });
      break;
    case 'TESTIMONIAL':
      await prisma.testimonial.delete({ where: { id } });
      break;
    case 'SERVICE':
      await prisma.service.delete({ where: { id } });
      break;
    case 'TECHNOLOGY':
      await prisma.technology.delete({ where: { id } });
      break;
    case 'BLOG_POST':
      await prisma.blogPost.delete({ where: { id } });
      break;
    case 'CLIENT':
      await prisma.client.delete({ where: { id } });
      break;
    case 'CAREER_APPLICATION':
      await prisma.careerApplication.delete({ where: { id } });
      break;
    case 'PARTNERSHIP_REQUEST':
      await prisma.partnershipRequest.delete({ where: { id } });
      break;
    case 'CAREER_POSITION':
      await prisma.careerPosition.delete({ where: { id } });
      break;
    case 'CONTACT_SUBMISSION':
      await prisma.contactSubmission.delete({ where: { id } });
      break;
    case 'MEDIA':
      await prisma.media.delete({ where: { id } });
      break;
    case 'NOTIFICATION':
      await prisma.notification.delete({ where: { id } });
      break;
    case 'TEAM_MEMBER':
      await prisma.teamMember.delete({ where: { id } });
      break;
    case 'FOUNDER':
      await prisma.founder.delete({ where: { id } });
      break;
  }

  // 5. Revalidate
  revalidateEntityPaths(entityType, originalSlug);

  return deletedItem;
}

/**
 * Restore an item from Recently Deleted
 */
export async function restoreItem({ id, adminUser }: RestoreOptions) {
  const deletedItem = await prisma.recentlyDeleted.findUnique({ where: { id } });
  if (!deletedItem) {
    throw new Error('Deleted item not found');
  }

  const rawData = JSON.parse(deletedItem.data);
  let conflictResolutionNote: string | null = null;

  // Clone payload to mutate for restoration
  const data: any = { ...rawData };

  // Remove timestamp fields that should be generated or updated
  delete data.updatedAt;

  switch (deletedItem.entityType as EntityType) {
    case 'CASE_STUDY': {
      const metrics = Array.isArray(data.metrics) ? data.metrics : [];
      delete data.metrics;

      // Check unique slug collision
      const existingSlug = await prisma.caseStudy.findUnique({ where: { slug: data.slug } });
      if (existingSlug) {
        const newSlug = `${data.slug}-restored-${Date.now().toString(36).slice(-4)}`;
        conflictResolutionNote = `Slug "${data.slug}" was taken by an active project. Restored with slug "${newSlug}".`;
        data.slug = newSlug;
      }

      // Check ID collision
      const existingId = await prisma.caseStudy.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;

      await prisma.caseStudy.create({
        data: {
          ...data,
          ...(metrics.length > 0
            ? {
                metrics: {
                  create: metrics.map((m: any) => ({
                    label: m.label,
                    value: m.value,
                    description: m.description || null,
                  })),
                },
              }
            : {}),
        },
      });
      break;
    }

    case 'PRODUCT': {
      const features = Array.isArray(data.features) ? data.features : [];
      delete data.features;

      // Check unique slug collision
      const existingSlug = await prisma.product.findUnique({ where: { slug: data.slug } });
      if (existingSlug) {
        const newSlug = `${data.slug}-restored-${Date.now().toString(36).slice(-4)}`;
        conflictResolutionNote = `Slug "${data.slug}" was taken. Restored with slug "${newSlug}".`;
        data.slug = newSlug;
      }

      const existingId = await prisma.product.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;

      await prisma.product.create({
        data: {
          ...data,
          ...(features.length > 0
            ? {
                features: {
                  create: features.map((f: any, idx: number) => ({
                    title: f.title,
                    description: f.description || '',
                    order: f.order ?? idx,
                  })),
                },
              }
            : {}),
        },
      });
      break;
    }

    case 'LEADERSHIP': {
      // Check unique slug & publicId
      const existingSlug = await prisma.leadership.findUnique({ where: { slug: data.slug } });
      if (existingSlug) {
        data.slug = `${data.slug}-restored-${Date.now().toString(36).slice(-4)}`;
        conflictResolutionNote = `Slug collision resolved as "${data.slug}".`;
      }
      const existingPublicId = await prisma.leadership.findUnique({ where: { publicId: data.publicId } });
      if (existingPublicId) {
        data.publicId = `${data.publicId}-R`;
      }

      const existingId = await prisma.leadership.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;

      await prisma.leadership.create({ data });
      break;
    }

    case 'TESTIMONIAL': {
      const existingId = await prisma.testimonial.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;
      await prisma.testimonial.create({ data });
      break;
    }

    case 'SERVICE': {
      const existingId = await prisma.service.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;
      await prisma.service.create({ data });
      break;
    }

    case 'TECHNOLOGY': {
      const existingSlug = await prisma.technology.findUnique({ where: { slug: data.slug } });
      if (existingSlug) {
        data.slug = `${data.slug}-restored-${Date.now().toString(36).slice(-4)}`;
        conflictResolutionNote = `Slug collision resolved as "${data.slug}".`;
      }
      const existingId = await prisma.technology.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;
      await prisma.technology.create({ data });
      break;
    }

    case 'BLOG_POST': {
      const existingSlug = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
      if (existingSlug) {
        data.slug = `${data.slug}-restored-${Date.now().toString(36).slice(-4)}`;
        conflictResolutionNote = `Slug collision resolved as "${data.slug}".`;
      }
      const existingId = await prisma.blogPost.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;
      await prisma.blogPost.create({ data });
      break;
    }

    case 'CLIENT': {
      if (data.slug) {
        const existingSlug = await prisma.client.findUnique({ where: { slug: data.slug } });
        if (existingSlug) data.slug = `${data.slug}-restored`;
      }
      const existingId = await prisma.client.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;
      await prisma.client.create({ data });
      break;
    }

    case 'CAREER_APPLICATION': {
      const notes = Array.isArray(data.notes) ? data.notes : [];
      delete data.notes;

      const existingRef = await prisma.careerApplication.findUnique({ where: { referenceId: data.referenceId } });
      if (existingRef) {
        data.referenceId = `${data.referenceId}-R`;
        conflictResolutionNote = `Reference ID collision resolved as "${data.referenceId}".`;
      }

      const existingId = await prisma.careerApplication.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;

      await prisma.careerApplication.create({
        data: {
          ...data,
          ...(notes.length > 0
            ? {
                notes: {
                  create: notes.map((n: any) => ({
                    authorName: n.authorName || 'Admin',
                    authorEmail: n.authorEmail || 'admin@quantumai.dev',
                    content: n.content,
                  })),
                },
              }
            : {}),
        },
      });
      break;
    }

    case 'PARTNERSHIP_REQUEST': {
      const notes = Array.isArray(data.notes) ? data.notes : [];
      delete data.notes;

      const existingRef = await prisma.partnershipRequest.findUnique({ where: { referenceId: data.referenceId } });
      if (existingRef) {
        data.referenceId = `${data.referenceId}-R`;
        conflictResolutionNote = `Reference ID collision resolved as "${data.referenceId}".`;
      }

      const existingId = await prisma.partnershipRequest.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;

      await prisma.partnershipRequest.create({
        data: {
          ...data,
          ...(notes.length > 0
            ? {
                notes: {
                  create: notes.map((n: any) => ({
                    authorName: n.authorName || 'Admin',
                    authorEmail: n.authorEmail || 'admin@quantumai.dev',
                    content: n.content,
                  })),
                },
              }
            : {}),
        },
      });
      break;
    }

    case 'CAREER_POSITION': {
      const existingTitle = await prisma.careerPosition.findUnique({ where: { title: data.title } });
      if (existingTitle) {
        data.title = `${data.title} (Restored)`;
        conflictResolutionNote = `Position title collision resolved as "${data.title}".`;
      }
      const existingId = await prisma.careerPosition.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;
      await prisma.careerPosition.create({ data });
      break;
    }

    case 'CONTACT_SUBMISSION': {
      const existingId = await prisma.contactSubmission.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;
      await prisma.contactSubmission.create({ data });
      break;
    }

    case 'MEDIA': {
      const existingId = await prisma.media.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;
      await prisma.media.create({ data });
      break;
    }

    case 'NOTIFICATION': {
      const existingId = await prisma.notification.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;
      await prisma.notification.create({ data });
      break;
    }

    case 'TEAM_MEMBER': {
      const existingId = await prisma.teamMember.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;
      await prisma.teamMember.create({ data });
      break;
    }

    case 'FOUNDER': {
      const existingId = await prisma.founder.findUnique({ where: { id: data.id } });
      if (existingId) delete data.id;
      await prisma.founder.create({ data });
      break;
    }
  }

  // Remove from RecentlyDeleted
  await prisma.recentlyDeleted.delete({ where: { id } });

  // Log Activity
  await prisma.activityLog.create({
    data: {
      userId: adminUser?.id || null,
      adminName: adminUser?.name || 'Administrator',
      adminEmail: adminUser?.email || null,
      action: 'RESTORE',
      entity: deletedItem.entityType,
      entityId: deletedItem.originalId,
      entityName: deletedItem.title,
      details: `Restored "${deletedItem.title}" to ${deletedItem.originalSection}.${
        conflictResolutionNote ? ` (${conflictResolutionNote})` : ''
      }`,
    },
  }).catch(() => {});

  // Revalidate
  revalidateEntityPaths(deletedItem.entityType as EntityType, deletedItem.originalSlug);

  return {
    success: true,
    item: deletedItem,
    conflictResolutionNote,
  };
}

/**
 * Permanently Delete an item from Recently Deleted
 */
export async function permanentDeleteItem({ id, adminUser }: PermanentDeleteOptions) {
  const item = await prisma.recentlyDeleted.findUnique({ where: { id } });
  if (!item) {
    throw new Error('Item not found in Recently Deleted');
  }

  // If item is MEDIA, purge the actual blob from storage
  if (item.entityType === 'MEDIA') {
    try {
      const data = JSON.parse(item.data);
      if (data.url && data.url.includes('public.blob.vercel-storage.com')) {
        const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
        await del(data.url, { token }).catch((err) => {
          console.error('Error purging blob file on permanent delete:', err);
        });
      }
    } catch (e) {
      console.error('Failed to parse media data during permanent delete:', e);
    }
  }

  // Permanently delete the record from RecentlyDeleted
  await prisma.recentlyDeleted.delete({ where: { id } });

  // Log Activity
  await prisma.activityLog.create({
    data: {
      userId: adminUser?.id || null,
      adminName: adminUser?.name || 'Administrator',
      adminEmail: adminUser?.email || null,
      action: 'PERMANENT_DELETE',
      entity: item.entityType,
      entityId: item.originalId,
      entityName: item.title,
      details: `Permanently deleted "${item.title}" (${item.originalSection}). This action cannot be undone.`,
    },
  }).catch(() => {});

  revalidatePath('/admin/recently-deleted');
  return { success: true };
}

/**
 * Empty Entire Recently Deleted Bin
 */
export async function emptyRecentlyDeleted({ adminUser }: { adminUser?: AdminUserInfo }) {
  const allItems = await prisma.recentlyDeleted.findMany();

  // Purge any media blobs
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
  for (const item of allItems) {
    if (item.entityType === 'MEDIA') {
      try {
        const data = JSON.parse(item.data);
        if (data.url && data.url.includes('public.blob.vercel-storage.com')) {
          await del(data.url, { token }).catch(() => {});
        }
      } catch {}
    }
  }

  const result = await prisma.recentlyDeleted.deleteMany();

  // Log Activity
  await prisma.activityLog.create({
    data: {
      userId: adminUser?.id || null,
      adminName: adminUser?.name || 'Administrator',
      adminEmail: adminUser?.email || null,
      action: 'EMPTY_RECENTLY_DELETED',
      entity: 'RECENTLY_DELETED',
      details: `Emptied all ${result.count} items from Recently Deleted.`,
    },
  }).catch(() => {});

  revalidatePath('/admin/recently-deleted');
  return { count: result.count };
}

/**
 * Fetch Deleted Items with Search, Filter & Pagination
 */
export async function getRecentlyDeletedItems({
  filter = 'ALL',
  section,
  search = '',
  dateRange = 'ALL',
  sortBy = 'NEWEST',
  page = 1,
  limit = 50,
}: GetDeletedItemsOptions) {
  const where: any = {};

  // Category filtering
  if (filter && filter !== 'ALL') {
    switch (filter) {
      case 'PROJECTS':
        where.entityType = 'CASE_STUDY';
        break;
      case 'PRODUCTS':
        where.entityType = 'PRODUCT';
        break;
      case 'LEADERSHIP':
        where.entityType = { in: ['LEADERSHIP', 'TEAM_MEMBER', 'FOUNDER'] };
        break;
      case 'TESTIMONIALS':
        where.entityType = 'TESTIMONIAL';
        break;
      case 'SERVICES':
        where.entityType = 'SERVICE';
        break;
      case 'TECHNOLOGY':
        where.entityType = 'TECHNOLOGY';
        break;
      case 'BLOG':
        where.entityType = 'BLOG_POST';
        break;
      case 'CLIENTS':
        where.entityType = 'CLIENT';
        break;
      case 'APPLICATIONS':
        where.entityType = { in: ['CAREER_APPLICATION', 'PARTNERSHIP_REQUEST', 'CAREER_POSITION'] };
        break;
      case 'CONTACTS':
        where.entityType = 'CONTACT_SUBMISSION';
        break;
      case 'MEDIA':
        where.entityType = 'MEDIA';
        break;
      case 'NOTIFICATIONS':
        where.entityType = 'NOTIFICATION';
        break;
      case 'OTHER':
        where.entityType = { notIn: ['CASE_STUDY', 'PRODUCT', 'LEADERSHIP', 'TESTIMONIAL', 'SERVICE', 'TECHNOLOGY', 'BLOG_POST', 'CLIENT', 'CAREER_APPLICATION', 'PARTNERSHIP_REQUEST', 'CONTACT_SUBMISSION', 'MEDIA'] };
        break;
      default:
        where.entityType = filter;
        break;
    }
  }

  // Section filtering
  if (section && section !== 'ALL') {
    where.originalSection = section;
  }

  // Date range filtering
  if (dateRange && dateRange !== 'ALL') {
    const now = new Date();
    if (dateRange === 'TODAY') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.deletedAt = { gte: startOfDay };
    } else if (dateRange === '7_DAYS') {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.deletedAt = { gte: d };
    } else if (dateRange === '30_DAYS') {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.deletedAt = { gte: d };
    }
  }

  // Search
  const q = search.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { subtitle: { contains: q, mode: 'insensitive' } },
      { originalSlug: { contains: q, mode: 'insensitive' } },
      { originalSection: { contains: q, mode: 'insensitive' } },
      { adminEmail: { contains: q, mode: 'insensitive' } },
      { adminName: { contains: q, mode: 'insensitive' } },
      { data: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Order
  let orderBy: any = { deletedAt: 'desc' };
  if (sortBy === 'OLDEST') orderBy = { deletedAt: 'asc' };
  else if (sortBy === 'NAME_ASC') orderBy = { title: 'asc' };
  else if (sortBy === 'NAME_DESC') orderBy = { title: 'desc' };

  const skip = (Math.max(1, page) - 1) * limit;

  const [totalCount, items, allCountsRaw] = await Promise.all([
    prisma.recentlyDeleted.count({ where }).catch(() => 0),
    prisma.recentlyDeleted.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }).catch(() => []),
    prisma.recentlyDeleted.findMany({
      select: { entityType: true, mediaUrls: true, deletedAt: true },
    }).catch(() => []),
  ]);

  // Aggregate category counts
  const categoryCounts: Record<string, number> = {
    ALL: allCountsRaw.length,
    PROJECTS: 0,
    PRODUCTS: 0,
    LEADERSHIP: 0,
    TESTIMONIALS: 0,
    SERVICES: 0,
    TECHNOLOGY: 0,
    BLOG: 0,
    CLIENTS: 0,
    APPLICATIONS: 0,
    CONTACTS: 0,
    MEDIA: 0,
    NOTIFICATIONS: 0,
    OTHER: 0,
  };

  let mediaBlobsCount = 0;
  let newestDeletedAt: Date | null = null;

  for (const item of allCountsRaw) {
    if (item.entityType === 'CASE_STUDY') categoryCounts.PROJECTS++;
    else if (item.entityType === 'PRODUCT') categoryCounts.PRODUCTS++;
    else if (['LEADERSHIP', 'TEAM_MEMBER', 'FOUNDER'].includes(item.entityType)) categoryCounts.LEADERSHIP++;
    else if (item.entityType === 'TESTIMONIAL') categoryCounts.TESTIMONIALS++;
    else if (item.entityType === 'SERVICE') categoryCounts.SERVICES++;
    else if (item.entityType === 'TECHNOLOGY') categoryCounts.TECHNOLOGY++;
    else if (item.entityType === 'BLOG_POST') categoryCounts.BLOG++;
    else if (item.entityType === 'CLIENT') categoryCounts.CLIENTS++;
    else if (['CAREER_APPLICATION', 'PARTNERSHIP_REQUEST', 'CAREER_POSITION'].includes(item.entityType)) categoryCounts.APPLICATIONS++;
    else if (item.entityType === 'CONTACT_SUBMISSION') categoryCounts.CONTACTS++;
    else if (item.entityType === 'MEDIA') {
      categoryCounts.MEDIA++;
      mediaBlobsCount++;
    } else if (item.entityType === 'NOTIFICATION') categoryCounts.NOTIFICATIONS++;
    else categoryCounts.OTHER++;

    if (!newestDeletedAt || new Date(item.deletedAt) > newestDeletedAt) {
      newestDeletedAt = new Date(item.deletedAt);
    }
  }

  return {
    items,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    page,
    limit,
    categoryCounts,
    stats: {
      total: allCountsRaw.length,
      recoverable: allCountsRaw.length,
      mediaOnHold: mediaBlobsCount,
      newestDeletedAt,
    },
  };
}

/**
 * Fetch Recent Recovery Audit Logs
 */
export async function getRecoveryAuditLogs(limit = 25) {
  return prisma.activityLog.findMany({
    where: {
      action: {
        in: ['SOFT_DELETE', 'RESTORE', 'PERMANENT_DELETE', 'EMPTY_RECENTLY_DELETED'],
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  }).catch(() => []);
}
