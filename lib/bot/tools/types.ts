import { BotToolDeclaration, BotToolContext } from '../types';

export interface BotToolImplementation {
  declaration: BotToolDeclaration;
  execute: (args: Record<string, any>, context: BotToolContext) => Promise<any>;
}
