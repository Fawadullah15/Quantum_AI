import { BotToolImplementation } from './types';

export const systemTimeTool: BotToolImplementation = {
  declaration: {
    name: 'get_current_time',
    description:
      'Get the current real-world UTC and localized date, time, day of the week, and ISO timestamp.',
    category: 'utility',
    requiredPermissions: ['public_read'],
    timeoutMs: 3000,
    resultFormat: 'JSON object containing currentTime, iso, unix, timezone, and utcTime.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        timezone: {
          type: 'string',
          minLength: 2,
          maxLength: 64,
          description:
            'Optional IANA timezone identifier (e.g. "America/New_York", "UTC", "Asia/Karachi", "Europe/London"). Defaults to UTC.',
        },
      },
    },
  },
  execute: async (args: { timezone?: string }) => {
    const requestedTz = (args?.timezone || 'UTC').trim() || 'UTC';
    const now = new Date();

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: requestedTz,
        dateStyle: 'full',
        timeStyle: 'long',
      });
      return {
        currentTime: formatter.format(now),
        utcTime: now.toUTCString(),
        iso: now.toISOString(),
        unix: now.getTime(),
        timezone: requestedTz,
        fallbackUsed: false,
      };
    } catch {
      return {
        currentTime: now.toUTCString(),
        utcTime: now.toUTCString(),
        iso: now.toISOString(),
        unix: now.getTime(),
        timezone: 'UTC',
        requestedTimezone: requestedTz,
        fallbackUsed: true,
        note: `Unknown IANA timezone "${requestedTz}". Returned UTC instead.`,
      };
    }
  },
};
