import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { savePrivateFile } from '@/lib/storage';
import {
  sendEmail,
  getApplicantConfirmationEmailHtml,
} from '@/lib/email';
import { createAdminNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const type = formData.get('type') as string; // 'PARTNERSHIP' | 'CAREER'

    if (!type || (type !== 'PARTNERSHIP' && type !== 'CAREER')) {
      return NextResponse.json({ error: 'Invalid submission type' }, { status: 400 });
    }

    const companyEmail = process.env.ADMIN_EMAIL || process.env.COMPANY_EMAIL || 'admin@quantumai.dev';

    // ─────────────────────────────────────────────────────────────
    // 1. BUSINESS PARTNERSHIP REQUEST
    // ─────────────────────────────────────────────────────────────
    if (type === 'PARTNERSHIP') {
      const fullName = (formData.get('fullName') as string)?.trim();
      const company = (formData.get('company') as string)?.trim() || null;
      const email = (formData.get('email') as string)?.trim().toLowerCase();
      const phone = (formData.get('phone') as string)?.trim() || null;
      const website = (formData.get('website') as string)?.trim() || null;
      const country = (formData.get('country') as string)?.trim() || null;
      const partnershipType = (formData.get('partnershipType') as string)?.trim();
      const subject = (formData.get('subject') as string)?.trim();
      const message = (formData.get('message') as string)?.trim();
      const budgetRange = (formData.get('budgetRange') as string)?.trim() || null;
      const preferredContactMethod = (formData.get('preferredContactMethod') as string)?.trim() || 'Email';
      const consent = formData.get('consent') === 'on' || formData.get('consent') === 'true';

      if (!fullName || !email || !partnershipType || !subject || !message) {
        return NextResponse.json({ error: 'Please fill in all required fields marked with *' }, { status: 400 });
      }

      if (!consent) {
        return NextResponse.json({ error: 'Consent to processing information is required' }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
      }

      // Handle optional attachment
      let attachmentUrl: string | null = null;
      const attachment = formData.get('attachment') as File | null;
      if (attachment && attachment.size > 0 && attachment.name) {
        try {
          const saved = await savePrivateFile(attachment, 'ptr');
          attachmentUrl = saved.storageRef;
        } catch (fileErr: any) {
          return NextResponse.json({ error: fileErr.message || 'Failed to upload attachment' }, { status: 400 });
        }
      }

      // Generate Reference ID (e.g. QA-PTR-7294)
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceId = `QA-PTR-${randomSuffix}`;

      // Save to database
      const partnership = await prisma.partnershipRequest.create({
        data: {
          referenceId,
          fullName,
          company,
          email,
          phone,
          website,
          country,
          partnershipType,
          subject,
          message,
          budgetRange,
          preferredContactMethod,
          attachmentUrl,
          status: 'NEW',
        },
      });

      // Centralized Admin Notification & Email Dispatch to quantumai.cmp@gmail.com
      await createAdminNotification({
        type: 'PARTNERSHIP',
        title: `New Partnership: ${subject}`,
        subtitle: `${fullName}${company ? ' • ' + company : ''} • ${partnershipType}`,
        senderName: fullName,
        senderEmail: email,
        preview: message.length > 120 ? message.slice(0, 120) + '...' : message,
        referenceId,
        link: `/admin/careers-partnerships/partnership/${partnership.id}`,
        details: {
          id: partnership.id,
          referenceId,
          fullName,
          email,
          phone,
          company,
          website,
          country,
          partnershipType,
          subject,
          message,
          budgetRange,
          preferredContactMethod,
          attachmentUrl,
          createdAt: partnership.createdAt,
        },
      });

      // Send confirmation email to applicant
      const confirmationHtml = getApplicantConfirmationEmailHtml(fullName, referenceId, 'PARTNERSHIP');
      await sendEmail({
        to: email,
        subject: `Partnership Proposal Received: ${referenceId} • Quantum AI`,
        html: confirmationHtml,
      }).catch((e) => console.error('[Email Error] Applicant confirmation failed:', e));

      return NextResponse.json({
        success: true,
        referenceId,
        message: 'Partnership request submitted successfully',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. CAREER APPLICATION
    // ─────────────────────────────────────────────────────────────
    if (type === 'CAREER') {
      const fullName = (formData.get('fullName') as string)?.trim();
      const email = (formData.get('email') as string)?.trim().toLowerCase();
      const phone = (formData.get('phone') as string)?.trim() || null;
      const currentLocation = (formData.get('currentLocation') as string)?.trim() || null;
      const linkedinUrl = (formData.get('linkedinUrl') as string)?.trim() || null;
      const githubUrl = (formData.get('githubUrl') as string)?.trim() || null;
      const portfolioUrl = (formData.get('portfolioUrl') as string)?.trim() || null;
      const position = (formData.get('position') as string)?.trim();
      const experienceLevel = (formData.get('experienceLevel') as string)?.trim();
      const skills = (formData.get('skills') as string)?.trim();
      const introduction = (formData.get('introduction') as string)?.trim();
      const whyQuantumAI = (formData.get('whyQuantumAI') as string)?.trim() || null;
      const workType = (formData.get('workType') as string)?.trim() || 'Full Time';
      const consent = formData.get('consent') === 'on' || formData.get('consent') === 'true';

      const resumeFile = formData.get('resume') as File | null;

      if (!fullName || !email || !position || !experienceLevel || !skills || !introduction) {
        return NextResponse.json({ error: 'Please fill in all required application fields marked with *' }, { status: 400 });
      }

      if (!resumeFile || resumeFile.size === 0) {
        return NextResponse.json({ error: 'Resume / CV document is required' }, { status: 400 });
      }

      if (!consent) {
        return NextResponse.json({ error: 'Consent to processing information is required' }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
      }

      // Upload Resume / CV
      let resumeUrl = '';
      try {
        const savedResume = await savePrivateFile(resumeFile, 'cv');
        resumeUrl = savedResume.storageRef;
      } catch (fileErr: any) {
        return NextResponse.json({ error: fileErr.message || 'Failed to upload Resume / CV' }, { status: 400 });
      }

      // Handle required profile photo
      let photoUrl: string | null = null;
      const photoFile = formData.get('photo') as File | null;
      if (!photoFile || photoFile.size === 0 || !photoFile.name) {
        return NextResponse.json({ error: 'Profile photo is required.' }, { status: 400 });
      }

      // Check size specifically for photo (e.g. 5MB)
      if (photoFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Profile photo exceeds 5MB limit.' }, { status: 400 });
      }
      
      // Check specific image mime types
      const allowedPhotoTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedPhotoTypes.includes((photoFile.type || '').toLowerCase())) {
        return NextResponse.json({ error: 'Profile photo must be a JPG, PNG, or WEBP image.' }, { status: 400 });
      }

      try {
        const savedPhoto = await savePrivateFile(photoFile, 'applicant-photo');
        photoUrl = savedPhoto.storageRef;
      } catch (fileErr: any) {
        return NextResponse.json({ error: fileErr.message || 'Failed to upload Profile photo.' }, { status: 400 });
      }

      // Handle optional additional document
      let additionalDocsUrl: string | null = null;
      const additionalDocs = formData.get('additionalDocs') as File | null;
      if (additionalDocs && additionalDocs.size > 0 && additionalDocs.name) {
        try {
          const savedDocs = await savePrivateFile(additionalDocs, 'doc');
          additionalDocsUrl = savedDocs.storageRef;
        } catch (fileErr: any) {
          return NextResponse.json({ error: fileErr.message || 'Failed to upload additional document' }, { status: 400 });
        }
      }

      // Generate Reference ID (e.g. QA-CAR-3841)
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceId = `QA-CAR-${randomSuffix}`;

      // Save to database
      const application = await prisma.careerApplication.create({
        data: {
          referenceId,
          fullName,
          email,
          phone,
          currentLocation,
          photoUrl,
          linkedinUrl,
          githubUrl,
          portfolioUrl,
          position,
          experienceLevel,
          skills,
          introduction,
          whyQuantumAI,
          resumeUrl,
          additionalDocsUrl,
          workType,
          status: 'NEW',
        },
      });

      // Centralized Admin Notification & Email Dispatch to quantumai.cmp@gmail.com
      await createAdminNotification({
        type: 'CAREER',
        title: `New Career Application: ${fullName}`,
        subtitle: `${position} • ${experienceLevel} (${workType})`,
        senderName: fullName,
        senderEmail: email,
        preview: introduction.length > 120 ? introduction.slice(0, 120) + '...' : introduction,
        referenceId,
        link: `/admin/careers-partnerships/career/${application.id}`,
        details: {
          id: application.id,
          referenceId,
          fullName,
          email,
          phone,
          currentLocation,
          photoUrl,
          linkedinUrl,
          githubUrl,
          portfolioUrl,
          position,
          experienceLevel,
          skills,
          introduction,
          whyQuantumAI,
          resumeUrl,
          additionalDocsUrl,
          workType,
          createdAt: application.createdAt,
        },
      });

      // Send applicant confirmation email
      const confirmationHtml = getApplicantConfirmationEmailHtml(fullName, referenceId, 'CAREER');
      await sendEmail({
        to: email,
        subject: `Application Received: ${position} • ${referenceId} • Quantum AI`,
        html: confirmationHtml,
      }).catch((e) => console.error('[Email Error] Applicant confirmation failed:', e));

      return NextResponse.json({
        success: true,
        referenceId,
        message: 'Application submitted successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
  } catch (error: any) {
    console.error('[Careers/Partnerships API Error]:', error);
    return NextResponse.json({ error: error?.message || 'Server error processing submission' }, { status: 500 });
  }
}
