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
 * Helper to build standard subjects and HTML templates for notifications
 */
export function buildNotificationEmailContent(params: {
  type: string;
  title: string;
  senderName?: string | null;
  senderEmail?: string | null;
  preview: string;
  details?: any;
  referenceId?: string | null;
  createdAt?: Date;
  emailSubject?: string;
  emailHtml?: string;
}) {
  const { type, title, senderName, senderEmail, preview, referenceId, createdAt = new Date() } = params;
  let details = params.details;
  if (typeof details === 'string') {
    try {
      details = JSON.parse(details);
    } catch {
      // keep as string
    }
  }

  let finalSubject = params.emailSubject;
  if (!finalSubject) {
    if (type === 'CONTACT') finalSubject = `[Quantum AI] New Contact Message: ${senderName || 'Inquiry'}`;
    else if (type === 'CAREER') finalSubject = `[Quantum AI] New Career Application: ${senderName || 'Candidate'} (${referenceId || 'QA-CAR'})`;
    else if (type === 'PARTNERSHIP') finalSubject = `[Quantum AI] New Partnership Application: ${title} (${referenceId || 'QA-PTR'})`;
    else if (type === 'PROJECT_INQUIRY') finalSubject = `[Quantum AI] New Project Inquiry: ${senderName || 'Inquiry'}`;
    else if (type === 'TESTIMONIAL') finalSubject = `[Quantum AI] New Testimonial Submission: ${senderName || title}`;
    else if (type === 'NEWSLETTER') finalSubject = `[Quantum AI] New Newsletter Subscription: ${senderEmail || 'Subscriber'}`;
    else finalSubject = `[Quantum AI] ${title}`;
  }

  let finalHtml = params.emailHtml;
  if (!finalHtml) {
    if (type === 'CONTACT' && details) {
      finalHtml = getContactAdminEmailHtml({
        name: senderName || details.name || 'Anonymous',
        email: senderEmail || details.email || 'no-email@quantumai.dev',
        phone: details.phone,
        company: details.company,
        projectType: details.projectType,
        budget: details.budget,
        message: details.message || preview,
        createdAt,
      });
    } else if (type === 'PARTNERSHIP' && details) {
      finalHtml = getPartnershipAdminEmailHtml({
        referenceId: referenceId || details.referenceId || 'QA-PTR',
        fullName: senderName || details.fullName || 'Partner Candidate',
        email: senderEmail || details.email || 'partner@quantumai.dev',
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
        createdAt,
      });
    } else if (type === 'CAREER' && details) {
      finalHtml = getCareerAdminEmailHtml({
        referenceId: referenceId || details.referenceId || 'QA-CAR',
        fullName: senderName || details.fullName || 'Applicant',
        email: senderEmail || details.email || 'applicant@quantumai.dev',
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
        createdAt,
      });
    } else {
      finalHtml = getGenericAdminEmailHtml({
        title,
        type,
        senderName: senderName || undefined,
        senderEmail: senderEmail || undefined,
        preview,
        details,
        referenceId: referenceId || undefined,
        createdAt,
      });
    }
  }

  return { subject: finalSubject, html: finalHtml };
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

  const recipient = ADMIN_NOTIFICATION_EMAIL;

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
        emailRecipient: recipient,
        emailRetryCount: 0,
      },
    });
  } catch (dbErr) {
    console.error('[Central Notification Service] Database creation error:', dbErr);
    // Return early if database write failed, so caller can still continue
    return null;
  }

  // 3. Prepare Email Dispatch
  const { subject: finalSubject, html: finalHtml } = buildNotificationEmailContent({
    type,
    title,
    senderName,
    senderEmail,
    preview,
    details,
    referenceId,
    createdAt: notificationRecord.createdAt,
    emailSubject,
    emailHtml,
  });

  // 4. Dispatch Email and Record Delivery Status
  let emailStatus: 'SENT' | 'FAILED' = 'FAILED';
  let emailError: string | null = null;
  let emailSentAt: Date | null = null;
  let emailFailedAt: Date | null = null;

  try {
    const emailResult = await sendEmailDetailed({
      to: recipient,
      subject: finalSubject,
      html: finalHtml,
      text: emailText,
    });

    if (emailResult.success) {
      emailStatus = 'SENT';
      emailSentAt = new Date();
      emailError = null;
    } else {
      emailStatus = 'FAILED';
      emailFailedAt = new Date();
      emailError = emailResult.error || 'Email dispatch failed';
    }
  } catch (err: any) {
    emailStatus = 'FAILED';
    emailFailedAt = new Date();
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
        emailSentAt,
        emailFailedAt,
        emailRecipient: recipient,
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

/**
 * Retries sending an email copy for an existing notification.
 * Updates emailStatus, timestamps, and retry count.
 */
export async function retryAdminNotificationEmail(notificationId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }

    const recipient = notification.emailRecipient || ADMIN_NOTIFICATION_EMAIL;

    const { subject, html } = buildNotificationEmailContent({
      type: notification.type,
      title: notification.title,
      senderName: notification.senderName,
      senderEmail: notification.senderEmail,
      preview: notification.preview,
      details: notification.details,
      referenceId: notification.referenceId,
      createdAt: notification.createdAt,
    });

    console.log(`[Email Retry] Retrying notification ID ${notificationId} to ${recipient}...`);

    const emailResult = await sendEmailDetailed({
      to: recipient,
      subject,
      html,
    });

    const isSuccess = emailResult.success;
    const now = new Date();

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        emailStatus: isSuccess ? 'SENT' : 'FAILED',
        emailError: isSuccess ? null : (emailResult.error || 'Retry failed'),
        emailSentAt: isSuccess ? now : notification.emailSentAt,
        emailFailedAt: isSuccess ? null : now,
        emailRecipient: recipient,
        emailRetryCount: {
          increment: 1,
        },
      },
    });

    try {
      revalidatePath('/api/admin/notifications');
      revalidatePath('/admin');
      revalidatePath('/admin/messages');
      revalidatePath('/admin/careers-partnerships');
    } catch {}

    return {
      success: isSuccess,
      notification: updated,
      error: emailResult.error,
      provider: emailResult.provider,
      messageId: emailResult.messageId,
    };
  } catch (err: any) {
    console.error(`[Email Retry] Exception for notification ${notificationId}:`, err);
    return {
      success: false,
      error: err?.message || 'Server error during email retry',
    };
  }
}
