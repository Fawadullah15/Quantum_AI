import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  sendEmail,
  getPartnershipAdminEmailHtml,
  getCareerAdminEmailHtml,
  getApplicantConfirmationEmailHtml,
} from '@/lib/email';

export const dynamic = 'force-dynamic';

async function saveFile(file: File, prefix: string): Promise<string> {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'application/zip',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Supported formats: PDF, DOC, DOCX, PNG, JPG, ZIP');
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error('File size exceeds 15MB limit');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${prefix}-${Date.now()}-${cleanName}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;

  if (token) {
    try {
      const blob = await put(`submissions/${fileName}`, file, {
        access: 'public',
        token,
      });
      return blob.url;
    } catch (err) {
      console.warn('[Upload] Blob upload failed, falling back to local:', err);
    }
  }

  // Fallback to local disk
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'submissions');
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filePath = join(uploadDir, fileName);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));
  return `/uploads/submissions/${fileName}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const type = formData.get('type') as string; // 'PARTNERSHIP' | 'CAREER'

    if (!type || (type !== 'PARTNERSHIP' && type !== 'CAREER')) {
      return NextResponse.json({ error: 'Invalid submission type' }, { status: 400 });
    }

    const companyEmail = process.env.ADMIN_EMAIL || process.env.COMPANY_EMAIL || 'fawadimraj@gmail.com';

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
          attachmentUrl = await saveFile(attachment, 'ptr');
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

      // Send automated admin notification email
      const adminEmailHtml = getPartnershipAdminEmailHtml({
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
        attachmentUrl,
        createdAt: partnership.createdAt,
      });

      await sendEmail({
        to: companyEmail,
        subject: `[Partnership Proposal] ${subject} (${referenceId})`,
        html: adminEmailHtml,
      }).catch((e) => console.error('[Email Error] Admin notification failed:', e));

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
        resumeUrl = await saveFile(resumeFile, 'cv');
      } catch (fileErr: any) {
        return NextResponse.json({ error: fileErr.message || 'Failed to upload Resume / CV' }, { status: 400 });
      }

      // Handle optional additional document
      let additionalDocsUrl: string | null = null;
      const additionalDocs = formData.get('additionalDocs') as File | null;
      if (additionalDocs && additionalDocs.size > 0 && additionalDocs.name) {
        try {
          additionalDocsUrl = await saveFile(additionalDocs, 'doc');
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

      // Send admin notification email
      const adminEmailHtml = getCareerAdminEmailHtml({
        referenceId,
        fullName,
        email,
        phone,
        currentLocation,
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
      });

      await sendEmail({
        to: companyEmail,
        subject: `[Career Application] ${fullName} - ${position} (${referenceId})`,
        html: adminEmailHtml,
      }).catch((e) => console.error('[Email Error] Admin notification failed:', e));

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
