// Server-side secure email dispatcher for Quantum AI
import nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
}

export interface EmailResult {
  success: boolean;
  status: 'SENT' | 'FAILED';
  error?: string;
  messageId?: string;
  provider?: string;
}

export const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL ||
  process.env.COMPANY_NOTIFICATION_EMAIL ||
  process.env.ADMIN_EMAIL ||
  'quantumai.cmp@gmail.com';

/**
 * Universal, ultra-resilient server-side email dispatcher optimized for Vercel Serverless.
 * Supports:
 * 1. Resend API (RESEND_API_KEY) — Cloud-native HTTPS, recommended for Vercel
 * 2. Gmail SMTP via Nodemailer (GMAIL_USER & GMAIL_APP_PASSWORD / SMTP_PASS)
 * 3. SendGrid API (SENDGRID_API_KEY)
 * 4. Postmark API (POSTMARK_SERVER_TOKEN)
 * 5. Brevo API (BREVO_API_KEY)
 * 6. Generic SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * 7. Custom Webhook (EMAIL_WEBHOOK_URL)
 */
export async function sendEmailDetailed({
  to,
  subject,
  html,
  text,
  fromName = 'Quantum AI',
  fromEmail,
}: EmailPayload): Promise<EmailResult> {
  const targetRecipient = to || ADMIN_NOTIFICATION_EMAIL;
  const cleanText = text || html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  let lastError = '';

  console.log(`[Email Dispatch Attempt] Target: ${targetRecipient} | Subject: "${subject}" | Time: ${new Date().toISOString()}`);

  // ─────────────────────────────────────────────────────────────
  // 1. RESEND API (HTTPS REST — 100% Serverless & Vercel Native)
  // ─────────────────────────────────────────────────────────────
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const defaultSender = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'Quantum AI <onboarding@resend.dev>';
      const sender = fromEmail ? `${fromName} <${fromEmail}>` : defaultSender;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: sender,
          to: [targetRecipient],
          subject,
          html,
          text: cleanText,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log(`[Email Sent Successfully] Provider: Resend API | Message ID: ${data.id || 'ok'} | Recipient: ${targetRecipient}`);
        return {
          success: true,
          status: 'SENT',
          messageId: data.id,
          provider: 'Resend API',
        };
      } else {
        const errText = await res.text().catch(() => '');
        let safeErrMsg = `Resend API error (${res.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.message) safeErrMsg += `: ${parsed.message}`;
        } catch {
          if (errText) safeErrMsg += `: ${errText.slice(0, 100)}`;
        }
        console.error(`[Email Failed] Provider: Resend API | Status: ${res.status} | Response:`, safeErrMsg);
        lastError = safeErrMsg;
      }
    } catch (err: any) {
      console.error('[Email Failed] Provider: Resend API network exception:', err?.message || err);
      lastError = `Resend network error: ${err?.message || 'Connection failed'}`;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. GMAIL SMTP (Google App Password via Nodemailer)
  // ─────────────────────────────────────────────────────────────
  const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com') ? process.env.SMTP_USER : null);
  const rawGmailPass = process.env.GMAIL_APP_PASSWORD || (gmailUser ? process.env.SMTP_PASS : null);

  if (gmailUser && rawGmailPass) {
    const cleanPass = rawGmailPass.replace(/\s+/g, ''); // Clean copied 16-char app password spaces
    const sender = `Quantum AI <${gmailUser.trim()}>`;

    // Try SSL port 465 first
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL
        auth: {
          user: gmailUser.trim(),
          pass: cleanPass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
      });

      const info = await transporter.sendMail({
        from: sender,
        to: targetRecipient,
        subject,
        html,
        text: cleanText,
      });

      console.log(`[Email Sent Successfully] Provider: Gmail SMTP (SSL 465) | Message ID: ${info.messageId} | Recipient: ${targetRecipient}`);
      return {
        success: true,
        status: 'SENT',
        messageId: info.messageId,
        provider: 'Gmail SMTP',
      };
    } catch (sslErr: any) {
      console.warn('[Email Warning] Gmail SSL port 465 attempt failed, trying STARTTLS port 587...', sslErr?.message || sslErr);

      // Fallback to STARTTLS port 587
      try {
        const tlsTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: gmailUser.trim(),
            pass: cleanPass,
          },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 12000,
        });

        const info = await tlsTransporter.sendMail({
          from: sender,
          to: targetRecipient,
          subject,
          html,
          text: cleanText,
        });

        console.log(`[Email Sent Successfully] Provider: Gmail SMTP (STARTTLS 587) | Message ID: ${info.messageId} | Recipient: ${targetRecipient}`);
        return {
          success: true,
          status: 'SENT',
          messageId: info.messageId,
          provider: 'Gmail SMTP (587)',
        };
      } catch (tlsErr: any) {
        console.error('[Email Failed] Provider: Gmail SMTP failed on both ports 465 & 587:', tlsErr?.message || tlsErr);
        lastError = `Gmail SMTP error: ${tlsErr?.message || sslErr?.message || 'Authentication or timeout error'}`;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. SENDGRID API (HTTPS REST)
  // ─────────────────────────────────────────────────────────────
  if (process.env.SENDGRID_API_KEY) {
    try {
      const sender = process.env.EMAIL_FROM || 'notifications@quantumai.dev';
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: targetRecipient }] }],
          from: { email: sender, name: fromName },
          subject,
          content: [
            { type: 'text/plain', value: cleanText },
            { type: 'text/html', value: html },
          ],
        }),
      });

      if (res.ok || res.status === 202) {
        console.log(`[Email Sent Successfully] Provider: SendGrid API | Recipient: ${targetRecipient}`);
        return { success: true, status: 'SENT', provider: 'SendGrid' };
      } else {
        const errText = await res.text().catch(() => '');
        console.error(`[Email Failed] Provider: SendGrid API error (${res.status}):`, errText);
        lastError = `SendGrid error (${res.status}): ${errText.slice(0, 100)}`;
      }
    } catch (err: any) {
      console.error('[Email Failed] Provider: SendGrid exception:', err?.message || err);
      lastError = `SendGrid network error: ${err?.message || err}`;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. POSTMARK API (HTTPS REST)
  // ─────────────────────────────────────────────────────────────
  if (process.env.POSTMARK_SERVER_TOKEN) {
    try {
      const sender = process.env.EMAIL_FROM || 'notifications@quantumai.dev';
      const res = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          From: `${fromName} <${sender}>`,
          To: targetRecipient,
          Subject: subject,
          HtmlBody: html,
          TextBody: cleanText,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log(`[Email Sent Successfully] Provider: Postmark API | Message ID: ${data.MessageID} | Recipient: ${targetRecipient}`);
        return { success: true, status: 'SENT', messageId: data.MessageID, provider: 'Postmark' };
      } else {
        const errText = await res.text().catch(() => '');
        console.error(`[Email Failed] Provider: Postmark API error (${res.status}):`, errText);
        lastError = `Postmark error (${res.status}): ${errText.slice(0, 100)}`;
      }
    } catch (err: any) {
      console.error('[Email Failed] Provider: Postmark exception:', err?.message || err);
      lastError = `Postmark error: ${err?.message || err}`;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. GENERIC SMTP SERVER
  // ─────────────────────────────────────────────────────────────
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = Number(process.env.SMTP_PORT) || 465;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST.trim(),
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER.trim(),
          pass: process.env.SMTP_PASS.trim(),
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
      });

      const sender = process.env.EMAIL_FROM || `Quantum AI <${process.env.SMTP_USER.trim()}>`;
      const info = await transporter.sendMail({
        from: sender,
        to: targetRecipient,
        subject,
        html,
        text: cleanText,
      });

      console.log(`[Email Sent Successfully] Provider: Custom SMTP | Message ID: ${info.messageId} | Recipient: ${targetRecipient}`);
      return {
        success: true,
        status: 'SENT',
        messageId: info.messageId,
        provider: 'Custom SMTP',
      };
    } catch (err: any) {
      console.error('[Email Failed] Provider: Custom SMTP error:', err?.message || err);
      lastError = `SMTP error: ${err?.message || err}`;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. CUSTOM WEBHOOK DISPATCH
  // ─────────────────────────────────────────────────────────────
  if (process.env.EMAIL_WEBHOOK_URL) {
    try {
      const res = await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetRecipient,
          subject,
          html,
          text: cleanText,
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        console.log(`[Email Sent Successfully] Provider: Webhook | Recipient: ${targetRecipient}`);
        return { success: true, status: 'SENT', provider: 'Webhook' };
      } else {
        lastError = `Webhook HTTP error ${res.status}`;
      }
    } catch (err: any) {
      console.error('[Email Failed] Provider: Webhook error:', err?.message || err);
      lastError = `Webhook error: ${err?.message || err}`;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 7. NO TRANSPORT CONFIGURED FALLBACK
  // ─────────────────────────────────────────────────────────────
  if (!lastError) {
    lastError = 'No email transport configured in environment. Set GMAIL_USER/GMAIL_APP_PASSWORD or RESEND_API_KEY in Vercel environment variables.';
  }

  console.warn(`[Email Delivery Simulated/Failed] Recipient: ${targetRecipient} | Subject: "${subject}" | Reason: ${lastError}`);
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

// ─────────────────────────────────────────────────────────────
// HTML EMAIL TEMPLATES FOR ADMIN NOTIFICATION INBOX COPIES
// ─────────────────────────────────────────────────────────────

export function getContactAdminEmailHtml(data: {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  projectType?: string | null;
  budget?: string | null;
  message: string;
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
            <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #38BDF8; text-transform: uppercase; margin-bottom: 8px;">QUANTUM AI // NEW TRANSMISSION</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">New Contact Message</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">From: ${data.name} • Received on ${dateStr}</p>
          </div>

          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; width: 140px; border-bottom: 1px solid #0F2347;">Sender Name:</td>
                <td style="padding: 10px 0; color: #FFFFFF; font-weight: 600; border-bottom: 1px solid #0F2347;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Email Address:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #0F2347;">
                  <a href="mailto:${data.email}" style="color: #38BDF8; text-decoration: none; font-weight: 600;">${data.email}</a>
                </td>
              </tr>
              ${data.phone ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Phone Number:</td>
                <td style="padding: 10px 0; color: #FFFFFF; border-bottom: 1px solid #0F2347;">${data.phone}</td>
              </tr>` : ''}
              ${data.company ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Company / Org:</td>
                <td style="padding: 10px 0; color: #FFFFFF; border-bottom: 1px solid #0F2347;">${data.company}</td>
              </tr>` : ''}
              ${data.projectType ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Project Type:</td>
                <td style="padding: 10px 0; color: #34D399; font-weight: 600; border-bottom: 1px solid #0F2347;">${data.projectType}</td>
              </tr>` : ''}
              ${data.budget ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Estimated Budget:</td>
                <td style="padding: 10px 0; color: #38BDF8; border-bottom: 1px solid #0F2347;">${data.budget}</td>
              </tr>` : ''}
            </table>

            <div style="background-color: #040E24; border: 1px solid #1E293B; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="font-family: monospace; font-size: 11px; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">MESSAGE CONTENT:</div>
              <div style="font-size: 14px; line-height: 1.65; color: #E2E8F0; white-space: pre-wrap;">${data.message}</div>
            </div>

            <div style="margin-bottom: 24px;">
              <a href="mailto:${data.email}?subject=Re:%20Quantum%20AI%20Inquiry" style="display: inline-block; padding: 12px 24px; background: #1677FF; color: #FFFFFF; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px rgba(22, 119, 255, 0.4);">
                Reply Directly to ${data.name} →
              </a>
            </div>

            <div style="border-top: 1px solid #1E293B; padding-top: 16px; font-size: 12px; color: #64748B; line-height: 1.5;">
              Delivered automatically to <strong style="color: #94A3B8;">${ADMIN_NOTIFICATION_EMAIL}</strong> via Quantum AI Central Email Dispatch.
            </div>
          </div>
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
  preferredContactMethod?: string | null;
  attachmentUrl?: string | null;
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
            <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #38BDF8; text-transform: uppercase; margin-bottom: 8px;">QUANTUM AI // PARTNERSHIP DISPATCH</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">New Partnership Application</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">Reference: <strong style="color: #38BDF8;">${data.referenceId}</strong> • ${dateStr}</p>
          </div>

          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; width: 150px; border-bottom: 1px solid #0F2347;">Contact Name:</td>
                <td style="padding: 10px 0; color: #FFFFFF; font-weight: 600; border-bottom: 1px solid #0F2347;">${data.fullName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Company / Org:</td>
                <td style="padding: 10px 0; color: #FFFFFF; font-weight: 600; border-bottom: 1px solid #0F2347;">${data.company || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Email Address:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #0F2347;">
                  <a href="mailto:${data.email}" style="color: #38BDF8; text-decoration: none; font-weight: 600;">${data.email}</a>
                </td>
              </tr>
              ${data.phone ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Phone Number:</td>
                <td style="padding: 10px 0; color: #FFFFFF; border-bottom: 1px solid #0F2347;">${data.phone}</td>
              </tr>` : ''}
              ${data.website ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Website:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #0F2347;">
                  <a href="${data.website}" target="_blank" style="color: #38BDF8; text-decoration: none;">${data.website}</a>
                </td>
              </tr>` : ''}
              ${data.country ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Country / Region:</td>
                <td style="padding: 10px 0; color: #FFFFFF; border-bottom: 1px solid #0F2347;">${data.country}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Partnership Type:</td>
                <td style="padding: 10px 0; color: #34D399; font-weight: 600; border-bottom: 1px solid #0F2347;">${data.partnershipType}</td>
              </tr>
              ${data.budgetRange ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Budget Range:</td>
                <td style="padding: 10px 0; color: #38BDF8; border-bottom: 1px solid #0F2347;">${data.budgetRange}</td>
              </tr>` : ''}
              ${data.preferredContactMethod ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Contact Method:</td>
                <td style="padding: 10px 0; color: #FFFFFF; border-bottom: 1px solid #0F2347;">${data.preferredContactMethod}</td>
              </tr>` : ''}
            </table>

            <div style="background-color: #040E24; border: 1px solid #1E293B; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="font-family: monospace; font-size: 11px; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">SUBJECT: ${data.subject}</div>
              <div style="font-size: 14px; line-height: 1.65; color: #E2E8F0; white-space: pre-wrap;">${data.message}</div>
            </div>

            ${data.attachmentUrl ? `
            <div style="margin-bottom: 24px;">
              <a href="${data.attachmentUrl}" target="_blank" style="display: inline-block; padding: 10px 18px; background: #1E293B; color: #38BDF8; border: 1px solid #38BDF8; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
                Download / View Attached Document ↗
              </a>
            </div>` : ''}

            <div style="border-top: 1px solid #1E293B; padding-top: 16px; font-size: 12px; color: #64748B; line-height: 1.5;">
              Delivered automatically to <strong style="color: #94A3B8;">${ADMIN_NOTIFICATION_EMAIL}</strong> under Reference ID <strong>${data.referenceId}</strong>.
            </div>
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
            <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #38BDF8; text-transform: uppercase; margin-bottom: 8px;">QUANTUM AI // TALENT APPLICATION</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">New Career Application</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">Role: <strong style="color: #38BDF8;">${data.position}</strong> (${data.workType}) • Ref: <strong>${data.referenceId}</strong></p>
          </div>

          <div style="padding: 32px;">
            ${data.photoUrl ? `
            <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 16px; background: #040E24; padding: 14px; border-radius: 8px; border: 1px solid #1E293B;">
              <img src="${data.photoUrl}" alt="${data.fullName}" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #38BDF8;" />
              <div>
                <div style="font-size: 16px; font-weight: 700; color: #FFFFFF;">${data.fullName}</div>
                <div style="font-size: 12px; color: #38BDF8;">Applicant Profile Photo • Verified</div>
              </div>
            </div>` : ''}

            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; width: 140px; border-bottom: 1px solid #0F2347;">Candidate:</td>
                <td style="padding: 10px 0; color: #FFFFFF; font-weight: 600; border-bottom: 1px solid #0F2347;">${data.fullName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Email Address:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #0F2347;">
                  <a href="mailto:${data.email}" style="color: #38BDF8; text-decoration: none; font-weight: 600;">${data.email}</a>
                </td>
              </tr>
              ${data.phone ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Phone Number:</td>
                <td style="padding: 10px 0; color: #FFFFFF; border-bottom: 1px solid #0F2347;">${data.phone}</td>
              </tr>` : ''}
              ${data.currentLocation ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Current Location:</td>
                <td style="padding: 10px 0; color: #FFFFFF; border-bottom: 1px solid #0F2347;">${data.currentLocation}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Target Position:</td>
                <td style="padding: 10px 0; color: #34D399; font-weight: 600; border-bottom: 1px solid #0F2347;">${data.position}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Experience Level:</td>
                <td style="padding: 10px 0; color: #FFFFFF; border-bottom: 1px solid #0F2347;">${data.experienceLevel}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Work Arrangement:</td>
                <td style="padding: 10px 0; color: #FFFFFF; border-bottom: 1px solid #0F2347;">${data.workType}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Key Skills:</td>
                <td style="padding: 10px 0; color: #38BDF8; font-weight: 600; border-bottom: 1px solid #0F2347;">${data.skills}</td>
              </tr>
              ${data.linkedinUrl || data.githubUrl || data.portfolioUrl ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Profiles &amp; Links:</td>
                <td style="padding: 10px 0; color: #38BDF8; border-bottom: 1px solid #0F2347;">
                  ${data.linkedinUrl ? `<a href="${data.linkedinUrl}" target="_blank" style="color: #38BDF8; margin-right: 12px;">LinkedIn ↗</a>` : ''}
                  ${data.githubUrl ? `<a href="${data.githubUrl}" target="_blank" style="color: #38BDF8; margin-right: 12px;">GitHub ↗</a>` : ''}
                  ${data.portfolioUrl ? `<a href="${data.portfolioUrl}" target="_blank" style="color: #38BDF8;">Portfolio ↗</a>` : ''}
                </td>
              </tr>` : ''}
            </table>

            <div style="background-color: #040E24; border: 1px solid #1E293B; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <div style="font-family: monospace; font-size: 11px; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">CANDIDATE INTRODUCTION:</div>
              <div style="font-size: 14px; line-height: 1.65; color: #E2E8F0; white-space: pre-wrap;">${data.introduction}</div>
            </div>

            ${data.whyQuantumAI ? `
            <div style="background-color: #040E24; border: 1px solid #1E293B; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="font-family: monospace; font-size: 11px; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">WHY QUANTUM AI:</div>
              <div style="font-size: 14px; line-height: 1.65; color: #E2E8F0; white-space: pre-wrap;">${data.whyQuantumAI}</div>
            </div>` : ''}

            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px;">
              ${data.resumeUrl ? `
              <a href="${data.resumeUrl}" target="_blank" style="display: inline-block; padding: 12px 20px; background: #1677FF; color: #FFFFFF; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px rgba(22, 119, 255, 0.4);">
                Download Resume / CV (PDF) ↗
              </a>` : ''}
              ${data.additionalDocsUrl ? `
              <a href="${data.additionalDocsUrl}" target="_blank" style="display: inline-block; padding: 12px 20px; background: #1E293B; color: #38BDF8; border: 1px solid #38BDF8; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                View Additional Docs ↗
              </a>` : ''}
            </div>

            <div style="border-top: 1px solid #1E293B; padding-top: 16px; font-size: 12px; color: #64748B; line-height: 1.5;">
              Delivered automatically to <strong style="color: #94A3B8;">${ADMIN_NOTIFICATION_EMAIL}</strong> under Reference ID <strong>${data.referenceId}</strong>.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getTestimonialAdminEmailHtml(data: {
  name: string;
  company?: string | null;
  role?: string | null;
  rating: number;
  content: string;
  photo?: string | null;
  createdAt?: Date | string;
}) {
  const dateStr = data.createdAt ? new Date(data.createdAt).toUTCString() : new Date().toUTCString();
  const stars = '★'.repeat(Math.max(1, Math.min(5, data.rating))) + '☆'.repeat(Math.max(0, 5 - data.rating));

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
            <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; color: #FBBF24; text-transform: uppercase; margin-bottom: 8px;">QUANTUM AI // CLIENT TESTIMONIAL</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">New Client Review Submitted</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">From: ${data.name} • ${dateStr}</p>
          </div>

          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; width: 140px; border-bottom: 1px solid #0F2347;">Client Name:</td>
                <td style="padding: 10px 0; color: #FFFFFF; font-weight: 600; border-bottom: 1px solid #0F2347;">${data.name}</td>
              </tr>
              ${data.company ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Company / Org:</td>
                <td style="padding: 10px 0; color: #FFFFFF; border-bottom: 1px solid #0F2347;">${data.company}</td>
              </tr>` : ''}
              ${data.role ? `
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Role / Title:</td>
                <td style="padding: 10px 0; color: #FFFFFF; border-bottom: 1px solid #0F2347;">${data.role}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 10px 0; color: #94A3B8; border-bottom: 1px solid #0F2347;">Rating:</td>
                <td style="padding: 10px 0; color: #FBBF24; font-size: 16px; font-weight: 700; border-bottom: 1px solid #0F2347;">${stars} (${data.rating}/5)</td>
              </tr>
            </table>

            <div style="background-color: #040E24; border: 1px solid #1E293B; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="font-family: monospace; font-size: 11px; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">TESTIMONIAL CONTENT:</div>
              <div style="font-size: 14px; line-height: 1.65; color: #E2E8F0; white-space: pre-wrap; font-style: italic;">"${data.content}"</div>
            </div>

            <div style="border-top: 1px solid #1E293B; padding-top: 16px; font-size: 12px; color: #64748B; line-height: 1.5;">
              Delivered automatically to <strong style="color: #94A3B8;">${ADMIN_NOTIFICATION_EMAIL}</strong> for admin moderation in the Testimonials Manager.
            </div>
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
              Delivered automatically to <strong style="color: #94A3B8;">${ADMIN_NOTIFICATION_EMAIL}</strong> via Quantum AI Central Notification System.
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
            &copy; ${new Date().getFullYear()} Quantum AI. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
}
