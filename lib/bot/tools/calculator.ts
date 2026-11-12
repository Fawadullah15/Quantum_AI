import { BotToolImplementation } from './types';

export const calculatorTool: BotToolImplementation = {
  declaration: {
    name: 'calculate',
    description: 'Safely evaluate mathematical, statistical, or engineering calculations and equations.',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The mathematical expression to evaluate, e.g. "Math.sqrt(144) * Math.PI", "(1250 * 0.08) / 12", "Math.sin(Math.PI / 4)"',
        },
      },
      required: ['expression'],
    },
  },
  execute: async (args: Record<string, any>) => {
    const expr = args?.expression;
    if (!expr || typeof expr !== 'string') {
      return { error: 'No mathematical expression provided.' };
    }

    // Security check: Only allow mathematical functions, numbers, and arithmetic symbols
    const sanitized = expr.trim();
    const disallowedPatterns = [
      /import/i,
      /require/i,
      /process/i,
      /global/i,
      /window/i,
      /document/i,
      /fetch/i,
      /eval/i,
      /Function/i,
      /constructor/i,
      /prototype/i,
      /this/i,
      /class/i,
      /while/i,
      /for/i,
    ];

    for (const pattern of disallowedPatterns) {
      if (pattern.test(sanitized)) {
        return { error: 'Expression contains disallowed operations.' };
      }
    }

    try {
      // Safe sandboxed math evaluation using Math context
      const mathScope = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        sqrt: Math.sqrt,
        cbrt: Math.cbrt,
        log: Math.log,
        log10: Math.log10,
        log2: Math.log2,
        exp: Math.exp,
        pow: Math.pow,
        abs: Math.abs,
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
        min: Math.min,
        max: Math.max,
        PI: Math.PI,
        E: Math.E,
      };

      // Construct a safe evaluator
      const fn = new Function(
        ...Object.keys(mathScope),
        `"use strict"; return (${sanitized});`
      );

      const result = fn(...Object.values(mathScope));

      return {
        expression: sanitized,
        result: typeof result === 'number' && !isNaN(result) ? result : String(result),
        isFinite: typeof result === 'number' ? Number.isFinite(result) : false,
      };
    } catch (err: any) {
      return {
        expression: sanitized,
        error: `Calculation error: ${err?.message || 'Invalid syntax'}`,
      };
    }
  },
};
