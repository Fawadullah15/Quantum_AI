// Server-side secure email dispatcher for Quantum AI
import nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  status: 'SENT' | 'FAILED';
  error?: string;
  messageId?: string;
}

export const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL ||
  process.env.COMPANY_NOTIFICATION_EMAIL ||
  process.env.ADMIN_EMAIL ||
  'quantumai.cmp@gmail.com';

/**
 * Robust server-side email dispatcher supporting:
 * 1. Gmail SMTP via Nodemailer (GMAIL_USER & GMAIL_APP_PASSWORD)
 * 2. Generic SMTP via Nodemailer (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * 3. Resend API (RESEND_API_KEY)
 * 4. Custom Webhook (EMAIL_WEBHOOK_URL)
 * 5. Safe development fallback logging
 */
export async function sendEmailDetailed({ to, subject, html, text }: EmailPayload): Promise<EmailResult> {
  const fromEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER || process.env.SMTP_USER || 'notifications@quantumai.dev';
  const cleanText = text || html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  let lastError = '';

  // 1. Gmail SMTP (e.g. Google App Password)
  const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com') ? process.env.SMTP_USER : null);
  const gmailPass = process.env.GMAIL_APP_PASSWORD || (gmailUser ? process.env.SMTP_PASS : null);

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const info = await transporter.sendMail({
        from: `Quantum AI <${gmailUser}>`,
        to,
        subject,
        html,
        text: cleanText,
      });

      return {
        success: true,
        status: 'SENT',
        messageId: info.messageId,
      };
    } catch (err: any) {
      console.error('[Email] Gmail SMTP dispatch error:', err);
      lastError = `Gmail SMTP error: ${err?.message || err}`;
    }
  }

  // 2. Generic SMTP Server
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = Number(process.env.SMTP_PORT) || 465;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `Quantum AI <${fromEmail}>`,
        to,
        subject,
        html,
        text: cleanText,
      });

      return {
        success: true,
        status: 'SENT',
        messageId: info.messageId,
      };
    } catch (err: any) {
      console.error('[Email] Custom SMTP dispatch error:', err);
      lastError = `SMTP error: ${err?.message || err}`;
    }
  }

  // 3. Resend API
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
          text: cleanText,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          success: true,
          status: 'SENT',
          messageId: data.id,
        };
      } else {
        const errBody = await res.text().catch(() => '');
        console.error('[Email] Resend API error response:', res.status, errBody);
        lastError = `Resend API error (${res.status}): ${errBody.slice(0, 120)}`;
      }
    } catch (err: any) {
      console.error('[Email] Resend API dispatch error:', err);
      lastError = `Resend error: ${err?.message || err}`;
    }
  }

  // 4. Custom Webhook Service
  if (process.env.EMAIL_WEBHOOK_URL) {
    try {
      const res = await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, from: fromEmail, subject, html, text: cleanText }),
      });

      if (res.ok) {
        return { success: true, status: 'SENT' };
      } else {
        lastError = `Webhook HTTP error ${res.status}`;
      }
    } catch (err: any) {
      console.error('[Email] Webhook dispatch error:', err);
      lastError = `Webhook error: ${err?.message || err}`;
    }
  }

  // 5. Fallback if no provider credentials are configured
  if (!lastError) {
    lastError = 'No email transport configured in environment (set GMAIL_USER/GMAIL_APP_PASSWORD or RESEND_API_KEY)';
  }

  console.warn(`[Email Delivery Simulated/Unsent] To: ${to} | Subject: ${subject} | Reason: ${lastError}`);
  return {
    success: false,
    status: 'FAILED',
    error: lastError,
  };
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const res = await sendEmailDetailed(payload);
  return res.success;
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

export function getGenericAdminEmailHtml(data: {
  title: string;
  type: string;
  senderName?: string | null;
  senderEmail?: string | null;
  preview: string;
  details?: Record<string, any> | null;
  referenceId?: string | null;
  createdAt?: Date | string;
}) {
  const dateStr = data.createdAt ? new Date(data.createdAt).toUTCString() : new Date().toUTCString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #F8FAFC;">
        <div style="max-width: 620px; margin: 0 auto; background-color: #07152F; border: 1px solid #1E3A8A; border-radius: 12px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.6);">
          
          <div style="background: linear-gradient(135deg, #0A192F 0%, #1E3A8A 100%); padding: 28px 32px; border-bottom: 1px solid #1E3A8A;">
            <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #38BDF8; text-transform: uppercase; margin-bottom: 8px;">QUANTUM AI // SYSTEM NOTIFICATION</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">${data.title}</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">Type: ${data.type} • Received on ${dateStr}</p>
          </div>

          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
              ${data.senderName ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; width: 140px; border-bottom: 1px solid #0F2347;">Sender Name:</td>
                <td style="padding: 10px 0; color: #FFFFFF; font-weight: 600; border-bottom: 1px solid #0F2347;">${data.senderName}</td>
              </tr>` : ''}
              ${data.senderEmail ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Sender Email:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #0F2347;">
                  <a href="mailto:${data.senderEmail}" style="color: #38BDF8; text-decoration: none;">${data.senderEmail}</a>
                </td>
              </tr>` : ''}
              ${data.referenceId ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Reference ID:</td>
                <td style="padding: 10px 0; color: #38BDF8; font-family: monospace; font-weight: 700; border-bottom: 1px solid #0F2347;">${data.referenceId}</td>
              </tr>` : ''}
            </table>

            <div style="background-color: #040E24; border: 1px solid #1E293B; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="font-family: monospace; font-size: 11px; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">SUBMISSION PREVIEW:</div>
              <div style="font-size: 14px; line-height: 1.65; color: #E2E8F0; white-space: pre-wrap;">${data.preview}</div>
            </div>

            ${data.details ? `
            <div style="background-color: #040E24; border: 1px solid #1E293B; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="font-family: monospace; font-size: 11px; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">ADDITIONAL DATA PAYLOAD:</div>
              <pre style="margin: 0; font-family: monospace; font-size: 12px; color: #94A3B8; overflow-x: auto; white-space: pre-wrap;">${JSON.stringify(data.details, null, 2)}</pre>
            </div>` : ''}

            <div style="border-top: 1px solid #1E293B; padding-top: 16px; font-size: 12px; color: #64748B; line-height: 1.5;">
              Delivered to <strong style="color: #94A3B8;">${ADMIN_NOTIFICATION_EMAIL}</strong> via Quantum AI Central Notification System.
            </div>
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
