import { BotMessage } from './types';

const FILLER_PREFIXES: RegExp[] = [
  /^(?:hey|hi|hello|greetings|yo|dear)\s+(?:quantumbot|quantum\s+bot|assistant|ai|there)[,!.:;\s-]*/i,
  /^(?:hey|hi|hello)[,!.\s]+/i,
  /^(?:can|could|would|will)\s+you\s+(?:please\s+)?(?:help\s+me\s+(?:to\s+|with\s+)?|explain\s+(?:to\s+me\s+)?|tell\s+me\s+(?:about\s+)?|write\s+(?:a\s+|an\s+|me\s+)?|create\s+(?:a\s+|an\s+)?|build\s+(?:a\s+|an\s+)?|show\s+me\s+(?:how\s+to\s+)?|summarize\s+)/i,
  /^(?:please\s+)?(?:explain\s+(?:to\s+me\s+)?|tell\s+me\s+(?:about\s+)?|help\s+me\s+(?:with\s+)?|describe\s+|compare\s+(?:and\s+contrast\s+)?|what\s+is\s+(?:a\s+|an\s+|the\s+)?|what\s+are\s+(?:the\s+)?|how\s+(?:do\s+i|to|does|can\s+i)\s+)/i,
  /^i\s+(?:want|need|would\s+like)\s+(?:to\s+)?(?:know\s+(?:about\s+)?|learn\s+(?:about\s+)?|understand\s+|build\s+|create\s+|ask\s+(?:about\s+)?)/i,
];

const LOWERCASE_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in', 'with', 'vs',
]);

const UPPERCASE_PRESERVE = new Map<string, string>([
  ['ai', 'AI'],
  ['api', 'API'],
  ['apis', 'APIs'],
  ['sql', 'SQL'],
  ['nosql', 'NoSQL'],
  ['pdf', 'PDF'],
  ['docx', 'DOCX'],
  ['xlsx', 'XLSX'],
  ['csv', 'CSV'],
  ['json', 'JSON'],
  ['html', 'HTML'],
  ['css', 'CSS'],
  ['ts', 'TS'],
  ['tsx', 'TSX'],
  ['js', 'JS'],
  ['jsx', 'JSX'],
  ['nextjs', 'Next.js'],
  ['next.js', 'Next.js'],
  ['react', 'React'],
  ['fastapi', 'FastAPI'],
  ['postgresql', 'PostgreSQL'],
  ['prisma', 'Prisma'],
  ['erp', 'ERP'],
  ['crm', 'CRM'],
  ['pos', 'POS'],
  ['rag', 'RAG'],
  ['llm', 'LLM'],
  ['llms', 'LLMs'],
  ['ui', 'UI'],
  ['ux', 'UX'],
  ['ceo', 'CEO'],
  ['quantumbot', 'QuantumBot'],
  ['quantum', 'Quantum'],
]);

function formatTitleWord(word: string, index: number): string {
  const lower = word.toLowerCase();
  const mapped = UPPERCASE_PRESERVE.get(lower);
  if (mapped) return mapped;
  if (index > 0 && LOWERCASE_WORDS.has(lower)) {
    return lower;
  }
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Generates a meaningful, concise conversation title (max ~46 chars) from the initial
 * conversation turn and attachments, avoiding generic fallback titles whenever content exists.
 */
export function generateSmartConversationTitle(
  messages: Array<Pick<BotMessage, 'role' | 'content' | 'attachments'>>
): string {
  const firstUser = messages.find((m) => m.role === 'user') || messages[0];
  if (!firstUser) return 'New Conversation';

  const rawText = (firstUser.content || '').replace(/```[\s\S]*?```/g, ' ').trim();
  const attachment = firstUser.attachments?.[0];

  if (!rawText && attachment?.name) {
    const cleanFile = attachment.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    const label = cleanFile ? `Analysis: ${cleanFile}` : `File: ${attachment.name}`;
    return label.length > 44 ? `${label.slice(0, 41)}...` : label;
  }

  let candidate = rawText
    .replace(/[#*`_~[\]()<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .split(/[.!?\n]/)[0]
    .trim();

  for (let pass = 0; pass < 2; pass++) {
    for (const pattern of FILLER_PREFIXES) {
      const stripped = candidate.replace(pattern, '').trim();
      if (stripped.length >= 4) {
        candidate = stripped;
      }
    }
  }

  candidate = candidate.replace(/^[:;\-–—,\s]+|[?!.,;:\s]+$/g, '').trim();
  if (!candidate && rawText) {
    candidate = rawText.replace(/\s+/g, ' ').trim();
  }
  if (!candidate) {
    return 'New Conversation';
  }

  // Pick up to 7 meaningful words while fitting cleanly within 46 chars
  const words = candidate.split(/\s+/).filter(Boolean).slice(0, 7);
  const formattedWords = words.map((w, idx) => formatTitleWord(w, idx));
  let title = formattedWords.join(' ');

  if (title.length > 46) {
    // Drop trailing words gracefully instead of chopping a word mid-letter
    while (formattedWords.length > 2 && formattedWords.join(' ').length > 43) {
      formattedWords.pop();
    }
    title = formattedWords.join(' ');
    if (title.length > 46) {
      title = `${title.slice(0, 43).trim()}...`;
    }
  }

  if (attachment?.name && !title.toLowerCase().includes(attachment.name.toLowerCase())) {
    if (title.length <= 24) {
      const shortFile = attachment.name.slice(0, 18);
      return `${title} (${shortFile})`;
    }
  }

  return title || 'New Conversation';
}
