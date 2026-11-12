import { BotToolImplementation } from './types';

const MAX_EXPRESSION_LENGTH = 500;
const MAX_PARSE_DEPTH = 64;

type Token =
  | { type: 'number'; value: number }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: '+' | '-' | '*' | '/' | '%' | '^' }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'comma' };

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  'math.pi': Math.PI,
  e: Math.E,
  'math.e': Math.E,
  tau: Math.PI * 2,
};

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sin: (x) => Math.sin(x),
  'math.sin': (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  'math.cos': (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  'math.tan': (x) => Math.tan(x),
  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),
  atan2: (y, x) => Math.atan2(y, x),
  sinh: (x) => Math.sinh(x),
  cosh: (x) => Math.cosh(x),
  tanh: (x) => Math.tanh(x),
  sqrt: (x) => {
    if (x < 0) throw new Error('Square root of negative real number is undefined.');
    return Math.sqrt(x);
  },
  'math.sqrt': (x) => {
    if (x < 0) throw new Error('Square root of negative real number is undefined.');
    return Math.sqrt(x);
  },
  cbrt: (x) => Math.cbrt(x),
  abs: (x) => Math.abs(x),
  'math.abs': (x) => Math.abs(x),
  round: (x) => Math.round(x),
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
  log: (x) => {
    if (x <= 0) throw new Error('Logarithm input must be positive.');
    return Math.log(x);
  },
  ln: (x) => {
    if (x <= 0) throw new Error('Natural logarithm input must be positive.');
    return Math.log(x);
  },
  log10: (x) => {
    if (x <= 0) throw new Error('Log10 input must be positive.');
    return Math.log10(x);
  },
  log2: (x) => {
    if (x <= 0) throw new Error('Log2 input must be positive.');
    return Math.log2(x);
  },
  exp: (x) => Math.exp(x),
  pow: (base, exponent) => Math.pow(base, exponent),
  'math.pow': (base, exponent) => Math.pow(base, exponent),
  min: (...nums) => {
    if (nums.length === 0) throw new Error('min() requires at least 1 argument.');
    return Math.min(...nums);
  },
  max: (...nums) => {
    if (nums.length === 0) throw new Error('max() requires at least 1 argument.');
    return Math.max(...nums);
  },
  hypot: (...nums) => Math.hypot(...nums),
  deg2rad: (deg) => (deg * Math.PI) / 180,
  rad2deg: (rad) => (rad * 180) / Math.PI,
};

function tokenizeMathExpression(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number literal (supports decimals & scientific notation like 1.25e-4)
    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < expr.length && /[0-9]/.test(expr[i + 1]))) {
      let start = i;
      while (i < expr.length && /[0-9._]/.test(expr[i])) i++;
      if (i < expr.length && (expr[i] === 'e' || expr[i] === 'E')) {
        const expPos = i;
        i++;
        if (i < expr.length && (expr[i] === '+' || expr[i] === '-')) i++;
        if (i < expr.length && /[0-9]/.test(expr[i])) {
          while (i < expr.length && /[0-9]/.test(expr[i])) i++;
        } else {
          i = expPos;
        }
      }
      const rawNum = expr.slice(start, i).replace(/_/g, '');
      const parsed = Number(rawNum);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid numeric literal "${rawNum}".`);
      }
      tokens.push({ type: 'number', value: parsed });
      continue;
    }

    // Identifier (constants or whitelisted math functions, optional Math. prefix)
    if (/[a-zA-Z]/.test(ch)) {
      let start = i;
      while (i < expr.length && /[a-zA-Z0-9_.]/.test(expr[i])) i++;
      const ident = expr.slice(start, i).toLowerCase();
      if (!(ident in CONSTANTS) && !(ident in FUNCTIONS)) {
        throw new Error(`Unknown identifier or disallowed symbol "${expr.slice(start, i)}".`);
      }
      tokens.push({ type: 'ident', value: ident });
      continue;
    }

    // Operators (** treated as exponentiation ^)
    if (ch === '*' && expr[i + 1] === '*') {
      tokens.push({ type: 'op', value: '^' });
      i += 2;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%' || ch === '^') {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }

    throw new Error(`Disallowed character "${ch}" in mathematical expression.`);
  }

  return tokens;
}

/**
 * Pure TypeScript recursive-descent mathematical evaluator.
 * Strictly prohibits arbitrary JavaScript evaluation (`eval`, `new Function`, property traversal).
 */
export function evaluateSafeMathExpression(expression: string): number {
  const clean = expression.trim();
  if (!clean) {
    throw new Error('Empty mathematical expression.');
  }
  if (clean.length > MAX_EXPRESSION_LENGTH) {
    throw new Error(`Expression exceeds maximum length of ${MAX_EXPRESSION_LENGTH} characters.`);
  }

  const tokens = tokenizeMathExpression(clean);
  if (tokens.length === 0) {
    throw new Error('No mathematical tokens found.');
  }

  let pos = 0;
  let depth = 0;

  const peek = (): Token | undefined => tokens[pos];
  const consume = (): Token => tokens[pos++];

  function parseExpression(): number {
    return parseAdditive();
  }

  function parseAdditive(): number {
    let left = parseMultiplicative();
    while (true) {
      const tok = peek();
      if (tok?.type === 'op' && (tok.value === '+' || tok.value === '-')) {
        consume();
        const right = parseMultiplicative();
        left = tok.value === '+' ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  }

  function parseMultiplicative(): number {
    let left = parsePower();
    while (true) {
      const tok = peek();
      if (tok?.type === 'op' && (tok.value === '*' || tok.value === '/' || tok.value === '%')) {
        consume();
        const right = parsePower();
        if (tok.value === '*') {
          left *= right;
        } else if (tok.value === '/') {
          if (right === 0) throw new Error('Division by zero.');
          left /= right;
        } else {
          if (right === 0) throw new Error('Modulo by zero.');
          left %= right;
        }
      } else {
        break;
      }
    }
    return left;
  }

  function parsePower(): number {
    const base = parseUnary();
    const tok = peek();
    if (tok?.type === 'op' && tok.value === '^') {
      consume();
      const exponent = parsePower(); // right-associative
      return Math.pow(base, exponent);
    }
    return base;
  }

  function parseUnary(): number {
    const tok = peek();
    if (tok?.type === 'op' && (tok.value === '+' || tok.value === '-')) {
      consume();
      const operand = parseUnary();
      return tok.value === '-' ? -operand : operand;
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    depth++;
    if (depth > MAX_PARSE_DEPTH) {
      throw new Error('Expression nesting depth exceeds safe limit.');
    }

    try {
      const tok = peek();
      if (!tok) {
        throw new Error('Unexpected end of mathematical expression.');
      }

      if (tok.type === 'number') {
        consume();
        return tok.value;
      }

      if (tok.type === 'lparen') {
        consume();
        const val = parseExpression();
        const closing = peek();
        if (closing?.type !== 'rparen') {
          throw new Error('Missing closing parenthesis ")".');
        }
        consume();
        return val;
      }

      if (tok.type === 'ident') {
        consume();
        const next = peek();
        if (next?.type === 'lparen') {
          const fn = FUNCTIONS[tok.value];
          if (!fn) {
            throw new Error(`"${tok.value}" is not a callable math function.`);
          }
          consume(); // consume '('
          const args: number[] = [];
          if (peek()?.type !== 'rparen') {
            args.push(parseExpression());
            while (peek()?.type === 'comma') {
              consume();
              args.push(parseExpression());
            }
          }
          if (peek()?.type !== 'rparen') {
            throw new Error(`Missing closing parenthesis in call to "${tok.value}()".`);
          }
          consume();
          const out = fn(...args);
          if (typeof out !== 'number' || Number.isNaN(out)) {
            throw new Error(`Function "${tok.value}" returned non-numeric result.`);
          }
          return out;
        }

        if (tok.value in CONSTANTS) {
          return CONSTANTS[tok.value];
        }

        throw new Error(`Function "${tok.value}" requires parentheses, e.g. ${tok.value}(x).`);
      }

      throw new Error(`Unexpected token in mathematical expression.`);
    } finally {
      depth--;
    }
  }

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new Error('Unexpected trailing tokens in mathematical expression.');
  }
  if (!Number.isFinite(result)) {
    throw new Error('Result is infinite or undefined (NaN).');
  }

  return result;
}

export const calculatorTool: BotToolImplementation = {
  declaration: {
    name: 'calculate',
    description:
      'Safely evaluate arithmetic, trigonometry, logarithms, powers, and engineering formulas without arbitrary code execution.',
    category: 'compute',
    requiredPermissions: ['compute'],
    timeoutMs: 3000,
    resultFormat: 'JSON object containing expression, numeric result, and isFinite flag.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        expression: {
          type: 'string',
          minLength: 1,
          maxLength: MAX_EXPRESSION_LENGTH,
          description:
            'Pure mathematical expression, e.g. "sqrt(144) * PI", "(1250 * 0.08) / 12", "pow(2, 10)", "sin(PI / 4)". Supports + - * / % ^ **, constants (PI, E, TAU), and functions (sin, cos, tan, sqrt, cbrt, abs, round, floor, ceil, log, log10, log2, exp, pow, min, max, hypot).',
        },
      },
      required: ['expression'],
    },
  },
  execute: async (args: Record<string, any>) => {
    const sanitized = String(args.expression || '').trim();
    const result = evaluateSafeMathExpression(sanitized);
    return {
      expression: sanitized,
      result,
      formatted: Number.isInteger(result) ? String(result) : Number(result.toPrecision(12)).toString(),
      isFinite: Number.isFinite(result),
    };
  },
};
