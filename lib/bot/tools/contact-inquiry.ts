import prisma from '@/lib/db';
import { createAdminNotification } from '@/lib/notifications';
import { BotToolImplementation } from './types';

export const contactInquiryTool: BotToolImplementation = {
  declaration: {
    name: 'submit_quantum_ai_inquiry',
    description:
      'Submit a formal project or contact inquiry to the Quantum AI team (support@quantumaitech.org). Because this sends an externally visible inquiry, explicit user confirmation is always required before execution.',
    category: 'action',
    requiredPermissions: ['external_write'],
    requiresConfirmation: true,
    timeoutMs: 8000,
    resultFormat: 'JSON object confirming submission reference ID, recipient, and delivery status.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          minLength: 2,
          maxLength: 100,
          description: 'Full name of the person submitting the inquiry.',
        },
        email: {
          type: 'string',
          minLength: 5,
          maxLength: 150,
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          description: 'Valid contact email address.',
        },
        message: {
          type: 'string',
          minLength: 10,
          maxLength: 2000,
          description: 'Project scope, question, or inquiry details.',
        },
        company: {
          type: 'string',
          maxLength: 120,
          description: 'Optional company or organization name.',
        },
        projectType: {
          type: 'string',
          enum: [
            'AI System',
            'Custom Software',
            'Automation',
            'Engineering Copilot',
            'General Inquiry',
          ],
          description: 'Optional inquiry category.',
        },
      },
      required: ['name', 'email', 'message'],
    },
  },
  formatConfirmationPreview: (args) => {
    const fields = [
      { label: 'Recipient', value: 'Quantum AI Team (support@quantumaitech.org)' },
      { label: 'Sender Name', value: String(args.name || '') },
      { label: 'Sender Email', value: String(args.email || '') },
    ];
    if (args.company) fields.push({ label: 'Company', value: String(args.company) });
    if (args.projectType) fields.push({ label: 'Project Type', value: String(args.projectType) });
    fields.push({
      label: 'Message',
      value:
        String(args.message || '').length > 240
          ? `${String(args.message).slice(0, 240)}...`
          : String(args.message || ''),
    });

    return {
      title: 'Confirm Sending Contact Inquiry',
      summary:
        'QuantumBot is ready to submit this inquiry to Quantum AI. Please review the details and approve to send.',
      fields,
    };
  },
  execute: async (args: Record<string, any>) => {
    const name = String(args.name).trim();
    const email = String(args.email).trim().toLowerCase();
    const message = String(args.message).trim();
    const company = args.company ? String(args.company).trim() : null;
    const projectType = args.projectType ? String(args.projectType).trim() : 'General Inquiry';

    if (process.env.DATABASE_URL) {
      try {
        const submission = await prisma.contactSubmission.create({
          data: {
            name,
            email,
            message,
            company,
            projectType,
            status: 'NEW',
          },
        });

        await createAdminNotification({
          type: 'PROJECT_INQUIRY',
          title: `QuantumBot Inquiry from ${name}`,
          subtitle: company ? `${company} • ${projectType}` : projectType,
          senderName: name,
          senderEmail: email,
          preview: message.length > 120 ? `${message.slice(0, 120)}...` : message,
          link: `/admin/messages/${submission.id}`,
          details: {
            id: submission.id,
            name,
            email,
            company,
            projectType,
            message,
            source: 'quantumbot_tool',
          },
        }).catch(() => {});

        return {
          submitted: true,
          deliveryMode: 'database_and_notification',
          referenceId: submission.id,
          recipient: 'support@quantumaitech.org',
          submittedAt: submission.createdAt,
          summary: `Inquiry saved (Ref: ${submission.id}) and routed to Quantum AI at support@quantumaitech.org.`,
        };
      } catch (err: any) {
        return {
          submitted: false,
          error: `Failed to persist inquiry to database: ${err?.message || 'database error'}. You can also email support@quantumaitech.org directly or use /contact.`,
        };
      }
    }

    // Environment has no DATABASE_URL configured locally; be transparent rather than pretending DB persistence
    return {
      submitted: false,
      deliveryMode: 'offline_fallback',
      recipient: 'support@quantumaitech.org',
      preparedPayload: { name, email, company, projectType, message },
      note: 'Inquiry backend database is not connected in this local environment. Please send directly to support@quantumaitech.org or via https://quantumaitech.org/contact.',
    };
  },
};
