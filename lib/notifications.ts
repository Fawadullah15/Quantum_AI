// Centralized Admin Notification & Dispatch Service for Quantum AI
import prisma from '@/lib/db';
import {
  sendEmailDetailed,
  ADMIN_NOTIFICATION_EMAIL,
  getContactAdminEmailHtml,
  getCareerAdminEmailHtml,
  getPartnershipAdminEmailHtml,
  getGenericAdminEmailHtml,
} from '@/lib/email';
import { revalidatePath } from 'next/cache';

export type NotificationType =
  | 'CONTACT'
  | 'CAREER'
  | 'PARTNERSHIP'
  | 'PROJECT_INQUIRY'
  | 'NEWSLETTER'
  | 'TESTIMONIAL'
  | 'SYSTEM';

export interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  subtitle?: string;
  senderName?: string;
  senderEmail?: string;
  preview: string;
  details?: Record<string, any>;
  referenceId?: string;
  link?: string;
  emailSubject?: string;
  emailHtml?: string;
  emailText?: string;
}

/**
 * Creates a centralized Notification record in the database,
 * attempts to dispatch an email copy to quantumai.cmp@gmail.com,
 * records the email delivery status (SENT / FAILED), and revalidates caches.
 *
 * Guaranteed NEVER to throw or fail the public caller if email dispatch fails.
 */
export async function createAdminNotification(params: CreateNotificationParams) {
  const {
    type,
    title,
    subtitle,
    senderName,
    senderEmail,
    preview,
    details,
    referenceId,
    link,
    emailSubject,
    emailHtml,
    emailText,
  } = params;

  // 1. Serialize details safely for database storage
  let serializedDetails: string | null = null;
  if (details) {
    try {
      serializedDetails = typeof details === 'string' ? details : JSON.stringify(details);
    } catch {
      serializedDetails = String(details);
    }
  }

  // 2. Persist notification to database with initial PENDING status
  let notificationRecord;
  try {
    notificationRecord = await prisma.notification.create({
      data: {
        type,
        title,
        subtitle: subtitle || null,
        senderName: senderName || null,
        senderEmail: senderEmail || null,
        preview,
        details: serializedDetails,
        referenceId: referenceId || null,
        link: link || null,
        read: false,
        emailStatus: 'PENDING',
      },
    });
  } catch (dbErr) {
    console.error('[Central Notification Service] Database creation error:', dbErr);
    // Return early if database write failed, so caller can still continue
    return null;
  }

  // 3. Prepare Email Dispatch
  const recipient = ADMIN_NOTIFICATION_EMAIL;
  let finalSubject = emailSubject;
  if (!finalSubject) {
    if (type === 'CONTACT') finalSubject = `[Quantum AI] New Contact Message: ${senderName || 'Inquiry'}`;
    else if (type === 'CAREER') finalSubject = `[Quantum AI] New Career Application: ${senderName || 'Candidate'} (${referenceId || 'QA-CAR'})`;
    else if (type === 'PARTNERSHIP') finalSubject = `[Quantum AI] New Partnership Application: ${title} (${referenceId || 'QA-PTR'})`;
    else if (type === 'PROJECT_INQUIRY') finalSubject = `[Quantum AI] New Project Inquiry: ${senderName || 'Inquiry'}`;
    else finalSubject = `[Quantum AI] ${title}`;
  }

  let finalHtml = emailHtml;
  if (!finalHtml) {
    if (type === 'CONTACT' && details) {
      finalHtml = getContactAdminEmailHtml({
        name: senderName || 'Anonymous',
        email: senderEmail || 'no-email@quantumai.dev',
        phone: details.phone,
        company: details.company,
        projectType: details.projectType,
        budget: details.budget,
        message: details.message || preview,
        createdAt: notificationRecord.createdAt,
      });
    } else if (type === 'PARTNERSHIP' && details) {
      finalHtml = getPartnershipAdminEmailHtml({
        referenceId: referenceId || 'QA-PTR',
        fullName: senderName || 'Partner Candidate',
        email: senderEmail || 'partner@quantumai.dev',
        phone: details.phone,
        company: details.company,
        website: details.website,
        country: details.country,
        partnershipType: details.partnershipType || 'Business Partnership',
        subject: details.subject || title,
        message: details.message || preview,
        budgetRange: details.budgetRange,
        preferredContactMethod: details.preferredContactMethod,
        attachmentUrl: details.attachmentUrl,
        createdAt: notificationRecord.createdAt,
      });
    } else if (type === 'CAREER' && details) {
      finalHtml = getCareerAdminEmailHtml({
        referenceId: referenceId || 'QA-CAR',
        fullName: senderName || 'Applicant',
        email: senderEmail || 'applicant@quantumai.dev',
        phone: details.phone,
        currentLocation: details.currentLocation,
        position: details.position || title,
        experienceLevel: details.experienceLevel || 'Unspecified',
        skills: details.skills || '',
        introduction: details.introduction || preview,
        whyQuantumAI: details.whyQuantumAI,
        linkedinUrl: details.linkedinUrl,
        githubUrl: details.githubUrl,
        portfolioUrl: details.portfolioUrl,
        photoUrl: details.photoUrl,
        resumeUrl: details.resumeUrl,
        additionalDocsUrl: details.additionalDocsUrl,
        workType: details.workType || 'Full Time',
        createdAt: notificationRecord.createdAt,
      });
    } else {
      finalHtml = getGenericAdminEmailHtml({
        title,
        type,
        senderName,
        senderEmail,
        preview,
        details,
        referenceId,
        createdAt: notificationRecord.createdAt,
      });
    }
  }

  // 4. Dispatch Email and Record Delivery Status
  let emailStatus: 'SENT' | 'FAILED' = 'FAILED';
  let emailError: string | null = null;

  try {
    const emailResult = await sendEmailDetailed({
      to: recipient,
      subject: finalSubject,
      html: finalHtml,
      text: emailText,
    });

    if (emailResult.success) {
      emailStatus = 'SENT';
    } else {
      emailStatus = 'FAILED';
      emailError = emailResult.error || 'Email dispatch failed';
    }
  } catch (err: any) {
    emailStatus = 'FAILED';
    emailError = err?.message || 'Unexpected email error';
    console.error('[Central Notification Service] Email dispatch error:', err);
  }

  // 5. Update Notification with final Email Status
  try {
    const updated = await prisma.notification.update({
      where: { id: notificationRecord.id },
      data: {
        emailStatus,
        emailError,
      },
    });
    notificationRecord = updated;
  } catch (updErr) {
    console.error('[Central Notification Service] Failed to update emailStatus:', updErr);
  }

  // 6. Cache Revalidation
  try {
    revalidatePath('/api/admin/notifications');
    revalidatePath('/admin');
  } catch {}

  return notificationRecord;
}
