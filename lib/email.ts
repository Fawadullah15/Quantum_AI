// Server-side secure email dispatcher for Quantum AI

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

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
    <div style="font-family: Arial, sans-serif; background-color: #040e24; color: #f8fafc; padding: 32px; border-radius: 12px; border: 1px solid #1e293b;">
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #38bdf8; font-size: 22px; margin: 0;">New Partnership Request [${data.referenceId}]</h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0 0;">Received on ${data.createdAt.toUTCString()}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
        <tr><td style="padding: 8px 0; color: #94a3b8; width: 160px;"><strong>Applicant Name:</strong></td><td style="color: #f8fafc;">${data.fullName}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Email:</strong></td><td style="color: #38bdf8;"><a href="mailto:${data.email}" style="color: #38bdf8;">${data.email}</a></td></tr>
        ${data.phone ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Phone / WhatsApp:</strong></td><td style="color: #f8fafc;">${data.phone}</td></tr>` : ''}
        ${data.company ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Company:</strong></td><td style="color: #f8fafc;">${data.company}</td></tr>` : ''}
        ${data.website ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Website:</strong></td><td style="color: #f8fafc;"><a href="${data.website}" target="_blank" style="color: #38bdf8;">${data.website}</a></td></tr>` : ''}
        ${data.country ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Country:</strong></td><td style="color: #f8fafc;">${data.country}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Partnership Type:</strong></td><td style="color: #f8fafc;"><strong>${data.partnershipType}</strong></td></tr>
        ${data.budgetRange ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Budget Range:</strong></td><td style="color: #f8fafc;">${data.budgetRange}</td></tr>` : ''}
        ${data.attachmentUrl ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Attachment:</strong></td><td style="color: #38bdf8;"><a href="${data.attachmentUrl}" target="_blank" style="color: #38bdf8;">View / Download Document ↗</a></td></tr>` : ''}
      </table>

      <div style="background-color: #081735; padding: 16px; border-radius: 8px; border: 1px solid #1e293b; margin-bottom: 24px;">
        <h3 style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.1em;">Subject: ${data.subject}</h3>
        <p style="color: #f8fafc; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.message}</p>
      </div>

      <div style="border-top: 1px solid #334155; padding-top: 16px; font-size: 12px; color: #64748b;">
        Quantum AI Automated System • Manage this submission in the Admin Panel.
      </div>
    </div>
  `;
}

export function getCareerAdminEmailHtml(data: {
  referenceId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  currentLocation?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  position: string;
  experienceLevel: string;
  skills: string;
  introduction: string;
  whyQuantumAI?: string | null;
  resumeUrl: string;
  additionalDocsUrl?: string | null;
  workType: string;
  createdAt: Date;
}) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #040e24; color: #f8fafc; padding: 32px; border-radius: 12px; border: 1px solid #1e293b;">
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #38bdf8; font-size: 22px; margin: 0;">New Career Application [${data.referenceId}]</h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 4px 0 0 0;">Position: <strong>${data.position}</strong> • ${data.workType} • ${data.createdAt.toUTCString()}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
        <tr><td style="padding: 8px 0; color: #94a3b8; width: 160px;"><strong>Candidate Name:</strong></td><td style="color: #f8fafc;">${data.fullName}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Email:</strong></td><td style="color: #38bdf8;"><a href="mailto:${data.email}" style="color: #38bdf8;">${data.email}</a></td></tr>
        ${data.phone ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Phone:</strong></td><td style="color: #f8fafc;">${data.phone}</td></tr>` : ''}
        ${data.currentLocation ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Location:</strong></td><td style="color: #f8fafc;">${data.currentLocation}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Experience Level:</strong></td><td style="color: #f8fafc;">${data.experienceLevel}</td></tr>
        <tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Skills:</strong></td><td style="color: #f8fafc;">${data.skills}</td></tr>
        ${data.linkedinUrl ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>LinkedIn:</strong></td><td style="color: #38bdf8;"><a href="${data.linkedinUrl}" target="_blank" style="color: #38bdf8;">${data.linkedinUrl}</a></td></tr>` : ''}
        ${data.githubUrl ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>GitHub:</strong></td><td style="color: #38bdf8;"><a href="${data.githubUrl}" target="_blank" style="color: #38bdf8;">${data.githubUrl}</a></td></tr>` : ''}
        ${data.portfolioUrl ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Portfolio:</strong></td><td style="color: #38bdf8;"><a href="${data.portfolioUrl}" target="_blank" style="color: #38bdf8;">${data.portfolioUrl}</a></td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Resume / CV:</strong></td><td style="color: #38bdf8;"><a href="${data.resumeUrl}" target="_blank" style="color: #38bdf8; font-weight: bold;">View Candidate CV ↗</a></td></tr>
        ${data.additionalDocsUrl ? `<tr><td style="padding: 8px 0; color: #94a3b8;"><strong>Additional Docs:</strong></td><td style="color: #38bdf8;"><a href="${data.additionalDocsUrl}" target="_blank" style="color: #38bdf8;">View Additional Documents ↗</a></td></tr>` : ''}
      </table>

      <div style="background-color: #081735; padding: 16px; border-radius: 8px; border: 1px solid #1e293b; margin-bottom: 24px;">
        <h3 style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.1em;">Introduction & Background</h3>
        <p style="color: #f8fafc; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; white-space: pre-wrap;">${data.introduction}</p>
        ${data.whyQuantumAI ? `
          <h3 style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.1em;">Why Quantum AI</h3>
          <p style="color: #f8fafc; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.whyQuantumAI}</p>
        ` : ''}
      </div>

      <div style="border-top: 1px solid #334155; padding-top: 16px; font-size: 12px; color: #64748b;">
        Quantum AI Automated System • Manage this application in the Admin Panel.
      </div>
    </div>
  `;
}

export function getApplicantConfirmationEmailHtml(name: string, referenceId: string, type: 'PARTNERSHIP' | 'CAREER') {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #040e24; color: #f8fafc; padding: 32px; border-radius: 12px; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto;">
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #38bdf8; font-size: 20px; margin: 0;">Submission Confirmation • Quantum AI</h1>
      </div>
      <p style="color: #f8fafc; font-size: 15px; line-height: 1.6;">Dear ${name},</p>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
        Thank you for reaching out to <strong>Quantum AI</strong>. We have successfully received your ${type === 'PARTNERSHIP' ? 'partnership proposal' : 'career application'} with reference ID:
      </p>
      <div style="background-color: #081735; padding: 12px 16px; border-radius: 8px; border: 1px solid #1677ff; text-align: center; margin: 20px 0; font-family: monospace; font-size: 18px; color: #38bdf8; font-weight: bold; letter-spacing: 0.1em;">
        ${referenceId}
      </div>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
        Our team reviews all incoming submissions carefully. If your ${type === 'PARTNERSHIP' ? 'proposal' : 'profile'} is a suitable match for our current initiatives, our leadership or engineering team will contact you directly.
      </p>
      <div style="border-top: 1px solid #334155; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #64748b;">
        Quantum AI • Intelligent Software & Neural Systems
      </div>
    </div>
  `;
}
