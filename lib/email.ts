// Server-side secure email dispatcher for Quantum AI

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const ADMIN_NOTIFICATION_EMAIL = process.env.COMPANY_NOTIFICATION_EMAIL || 'fawadimraj@gmail.com';

export async function sendEmail({ to, subject, html, text }: EmailPayload): Promise<boolean> {
  const fromEmail = process.env.EMAIL_FROM || 'notifications@quantumai.dev';
  
  // 1. Resend API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Quantum AI <${fromEmail}>`,
          to,
          subject,
          html,
          text,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error('[Email] Resend API dispatch error:', err);
    }
  }

  // 2. Custom Webhook / SMTP Service if configured
  if (process.env.EMAIL_WEBHOOK_URL) {
    try {
      const res = await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, from: fromEmail, subject, html, text }),
      });
      return res.ok;
    } catch (err) {
      console.error('[Email] Webhook dispatch error:', err);
    }
  }

  // 3. Fallback: Log email details safely in server console
  console.log(`[Email Dispatched] To: ${to} | Subject: ${subject}`);
  return true;
}

export function getContactAdminEmailHtml(data: {
  name: string;
  email: string;
  company?: string | null;
  projectType?: string | null;
  message: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"/></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #030712; color: #F8FAFC; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #07152F; border: 1px solid #1E3A8A; border-radius: 12px; padding: 32px;">
          <div style="font-family: monospace; font-size: 12px; color: #38BDF8; letter-spacing: 2px; margin-bottom: 8px;">QUANTUM AI // NEW TRANSMISSION</div>
          <h1 style="font-size: 22px; color: #FFFFFF; margin: 0 0 20px 0;">New Project Inquiry Received</h1>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; color: #94A3B8; width: 140px;">Sender Name:</td><td style="padding: 8px 0; color: #FFFFFF; font-weight: 600;">${data.name}</td></tr>
            <tr><td style="padding: 8px 0; color: #94A3B8;">Email:</td><td style="padding: 8px 0; color: #38BDF8;"><a href="mailto:${data.email}" style="color: #38BDF8;">${data.email}</a></td></tr>
            ${data.company ? `<tr><td style="padding: 8px 0; color: #94A3B8;">Company:</td><td style="padding: 8px 0; color: #FFFFFF;">${data.company}</td></tr>` : ''}
            ${data.projectType ? `<tr><td style="padding: 8px 0; color: #94A3B8;">Project Type:</td><td style="padding: 8px 0; color: #34D399; font-weight: 600;">${data.projectType}</td></tr>` : ''}
          </table>
          <div style="background: #040E24; border: 1px solid #1E293B; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="font-size: 12px; color: #94A3B8; margin-bottom: 8px; text-transform: uppercase;">Message Content:</div>
            <div style="font-size: 14px; line-height: 1.6; color: #E2E8F0; white-space: pre-wrap;">${data.message}</div>
          </div>
          <a href="mailto:${data.email}" style="display: inline-block; padding: 10px 20px; background: #1677FF; color: #FFFFFF; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Reply Directly to ${data.name}</a>
        </div>
      </body>
    </html>
  `;
}

export function getPartnershipAdminEmailHtml(data: {
  referenceId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
  country?: string | null;
  partnershipType: string;
  subject: string;
  message: string;
  budgetRange?: string | null;
  attachmentUrl?: string | null;
  createdAt: Date;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"/></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #030712; color: #F8FAFC; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #07152F; border: 1px solid #1E3A8A; border-radius: 12px; padding: 32px;">
          <div style="font-family: monospace; font-size: 12px; color: #38BDF8; letter-spacing: 2px; margin-bottom: 8px;">QUANTUM AI // PARTNERSHIP DISPATCH</div>
          <h1 style="font-size: 22px; color: #FFFFFF; margin: 0 0 6px 0;">New Partnership Request: ${data.referenceId}</h1>
          <p style="font-size: 14px; color: #94A3B8; margin: 0 0 24px 0;">Type: <strong style="color: #38BDF8;">${data.partnershipType}</strong></p>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; color: #94A3B8; width: 140px;">Contact Name:</td><td style="padding: 8px 0; color: #FFFFFF; font-weight: 600;">${data.fullName}</td></tr>
            <tr><td style="padding: 8px 0; color: #94A3B8;">Email:</td><td style="padding: 8px 0; color: #38BDF8;"><a href="mailto:${data.email}" style="color: #38BDF8;">${data.email}</a></td></tr>
            ${data.phone ? `<tr><td style="padding: 8px 0; color: #94A3B8;">Phone:</td><td style="padding: 8px 0; color: #FFFFFF;">${data.phone}</td></tr>` : ''}
            ${data.company ? `<tr><td style="padding: 8px 0; color: #94A3B8;">Company:</td><td style="padding: 8px 0; color: #FFFFFF;">${data.company}</td></tr>` : ''}
            ${data.website ? `<tr><td style="padding: 8px 0; color: #94A3B8;">Website:</td><td style="padding: 8px 0; color: #38BDF8;"><a href="${data.website}" style="color: #38BDF8;">${data.website}</a></td></tr>` : ''}
            ${data.budgetRange ? `<tr><td style="padding: 8px 0; color: #94A3B8;">Budget Range:</td><td style="padding: 8px 0; color: #34D399;">${data.budgetRange}</td></tr>` : ''}
          </table>

          <div style="background: #040E24; border: 1px solid #1E293B; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="font-size: 12px; color: #94A3B8; margin-bottom: 8px; text-transform: uppercase;">Subject: ${data.subject}</div>
            <div style="font-size: 14px; line-height: 1.6; color: #E2E8F0; white-space: pre-wrap;">${data.message}</div>
          </div>

          ${data.attachmentUrl ? `
            <div style="margin-bottom: 24px;">
              <a href="${data.attachmentUrl}" style="display: inline-block; padding: 10px 18px; background: #1E293B; color: #38BDF8; border: 1px solid #38BDF8; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">Download / View Attached Document ↗</a>
            </div>
          ` : ''}

          <div style="border-top: 1px solid #1E293B; padding-top: 16px; font-size: 12px; color: #64748B;">
            Submission logged in Quantum AI Admin Console under reference <strong>${data.referenceId}</strong>.
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getCareerAdminEmailHtml(data: {
  referenceId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  currentLocation?: string | null;
  position: string;
  experienceLevel: string;
  skills: string;
  introduction: string;
  whyQuantumAI?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  photoUrl?: string | null;
  resumeUrl?: string | null;
  additionalDocsUrl?: string | null;
  workType: string;
  createdAt: Date;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"/></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #030712; color: #F8FAFC; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #07152F; border: 1px solid #1E3A8A; border-radius: 12px; padding: 32px;">
          <div style="font-family: monospace; font-size: 12px; color: #38BDF8; letter-spacing: 2px; margin-bottom: 8px;">QUANTUM AI // TALENT APPLICATION</div>
          <h1 style="font-size: 22px; color: #FFFFFF; margin: 0 0 6px 0;">New Career Application: ${data.referenceId}</h1>
          <p style="font-size: 14px; color: #94A3B8; margin: 0 0 24px 0;">Role: <strong style="color: #38BDF8;">${data.position}</strong> (${data.workType})</p>
          
          ${data.photoUrl ? `
            <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 16px;">
              <img src="${data.photoUrl}" alt="${data.fullName}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid #38BDF8;" />
              <div>
                <strong style="font-size: 16px; color: #FFFFFF;">${data.fullName}</strong>
                <div style="font-size: 13px; color: #38BDF8;">Applicant Profile Photo</div>
              </div>
            </div>
          ` : ''}

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; color: #94A3B8; width: 140px;">Candidate:</td><td style="padding: 8px 0; color: #FFFFFF; font-weight: 600;">${data.fullName}</td></tr>
            <tr><td style="padding: 8px 0; color: #94A3B8;">Email:</td><td style="padding: 8px 0; color: #38BDF8;"><a href="mailto:${data.email}" style="color: #38BDF8;">${data.email}</a></td></tr>
            ${data.phone ? `<tr><td style="padding: 8px 0; color: #94A3B8;">Phone:</td><td style="padding: 8px 0; color: #FFFFFF;">${data.phone}</td></tr>` : ''}
            ${data.currentLocation ? `<tr><td style="padding: 8px 0; color: #94A3B8;">Location:</td><td style="padding: 8px 0; color: #FFFFFF;">${data.currentLocation}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #94A3B8;">Experience:</td><td style="padding: 8px 0; color: #FFFFFF;">${data.experienceLevel}</td></tr>
            <tr><td style="padding: 8px 0; color: #94A3B8;">Key Skills:</td><td style="padding: 8px 0; color: #38BDF8;">${data.skills}</td></tr>
          </table>

          <div style="background: #040E24; border: 1px solid #1E293B; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="font-size: 12px; color: #94A3B8; margin-bottom: 8px; text-transform: uppercase;">Candidate Intro:</div>
            <div style="font-size: 14px; line-height: 1.6; color: #E2E8F0; white-space: pre-wrap;">${data.introduction}</div>
          </div>

          ${data.resumeUrl ? `
            <div style="margin-bottom: 24px;">
              <a href="${data.resumeUrl}" style="display: inline-block; padding: 10px 18px; background: #1677FF; color: #FFFFFF; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">Download Candidate CV (PDF) ↗</a>
            </div>
          ` : ''}

          <div style="border-top: 1px solid #1E293B; padding-top: 16px; font-size: 12px; color: #64748B;">
            Application logged in Quantum AI Admin Console under reference <strong>${data.referenceId}</strong>.
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getApplicantConfirmationEmailHtml(fullName: string, referenceId: string, type: 'PARTNERSHIP' | 'CAREER') {
  const isPartnership = type === 'PARTNERSHIP';
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"/></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #030712; color: #F8FAFC; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #07152F; border: 1px solid #1E3A8A; border-radius: 12px; padding: 32px;">
          <div style="font-family: monospace; font-size: 12px; color: #38BDF8; letter-spacing: 2px; margin-bottom: 8px;">QUANTUM AI</div>
          <h1 style="font-size: 20px; color: #FFFFFF; margin: 0 0 16px 0;">Transmission Received</h1>
          <p style="font-size: 15px; line-height: 1.7; color: #CBD5E1; margin: 0 0 20px 0;">
            Hello ${fullName},<br/><br/>
            Thank you for reaching out to Quantum AI. Your ${isPartnership ? 'partnership inquiry' : 'career application'} has been successfully registered with our system.
          </p>

          <div style="background: #040E24; border: 1px solid #1677FF; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">YOUR REFERENCE ID</div>
            <div style="font-family: monospace; font-size: 20px; font-weight: 700; color: #38BDF8; letter-spacing: 1px;">${referenceId}</div>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin: 0 0 24px 0;">
            Our engineering leadership reviews incoming submissions continuously. If your inquiry aligns with our current roadmap, an engineer or partnership lead will reach out directly.
          </p>

          <div style="border-top: 1px solid #1E293B; padding-top: 16px; font-size: 12px; color: #64748B;">
            © ${new Date().getFullYear()} Quantum AI. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
}
