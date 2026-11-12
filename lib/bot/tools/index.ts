import { BotTool, BotToolContext } from '../types';
import { systemTimeTool } from './system-time';
import { calculatorTool } from './calculator';
import { companyKnowledgeTool } from './company-knowledge';
import { webSearchTool } from './web-search';

export const STANDARD_BOT_TOOLS: BotTool[] = [
  systemTimeTool,
  calculatorTool,
  companyKnowledgeTool,
  webSearchTool,
];

export function getToolByName(name: string): BotTool | undefined {
  return STANDARD_BOT_TOOLS.find((t) => t.declaration.name === name);
}

export async function executeToolCall(
  name: string,
  args: Record<string, any>,
  context: BotToolContext = {}
): Promise<{ result: any; isError: boolean }> {
  const tool = getToolByName(name);
  if (!tool) {
    return {
      result: { error: `Tool "${name}" is not registered in the QuantumBot system.` },
      isError: true,
    };
  }

  try {
    const result = await tool.execute(args, context);
    return { result, isError: false };
  } catch (err: any) {
    return {
      result: { error: err?.message || 'Tool execution encountered an internal error.' },
      isError: true,
    };
  }
}
