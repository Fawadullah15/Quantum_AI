import { BotToolImplementation } from './types';

export const systemTimeTool: BotToolImplementation = {
  declaration: {
    name: 'get_current_time',
    description: 'Get the current real-world date, time, day of the week, and UTC offset.',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Optional IANA timezone name (e.g. "America/New_York", "UTC", "Asia/Karachi"). Defaults to UTC.',
        },
      },
    },
  },
  execute: async (args: { timezone?: string }) => {
    const tz = args?.timezone || 'UTC';
    const now = new Date();
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        dateStyle: 'full',
        timeStyle: 'long',
      });
      return {
        currentTime: formatter.format(now),
        iso: now.toISOString(),
        unix: now.getTime(),
        timezone: tz,
      };
    } catch {
      return {
        currentTime: now.toUTCString(),
        iso: now.toISOString(),
        unix: now.getTime(),
        timezone: 'UTC',
      };
    }
  },
};
