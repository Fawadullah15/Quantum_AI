import { BotToolDeclaration, BotToolContext } from '../types';

export interface BotToolImplementation {
  declaration: BotToolDeclaration;
  isEnabled?: (context: BotToolContext) => boolean;
  formatConfirmationPreview?: (args: Record<string, any>) => {
    title: string;
    summary: string;
    fields: Array<{ label: string; value: string }>;
  };
  execute: (args: Record<string, any>, context: BotToolContext) => Promise<any>;
}
