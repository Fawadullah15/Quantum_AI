export interface TextCodeExtractionResult {
  text: string;
  kind: 'code' | 'text';
  language?: string;
  lineCount: number;
  charCount: number;
  truncated: boolean;
}

const MAX_EXTRACTED_CHARS = 120000;

const CODE_LANGUAGE_MAP: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TypeScript JSX',
  js: 'JavaScript',
  jsx: 'JavaScript JSX',
  mjs: 'JavaScript ESM',
  cjs: 'JavaScript CJS',
  py: 'Python',
  go: 'Go',
  rs: 'Rust',
  java: 'Java',
  c: 'C',
  h: 'C/C++ Header',
  cpp: 'C++',
  cc: 'C++',
  hpp: 'C++ Header',
  cs: 'C#',
  rb: 'Ruby',
  php: 'PHP',
  sql: 'SQL',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  xml: 'XML',
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  less: 'Less',
  prisma: 'Prisma Schema',
  graphql: 'GraphQL',
  gql: 'GraphQL',
  ini: 'INI Config',
};

/**
 * Validates and extracts plain text, Markdown, config, or source code files.
 * Rejects masqueraded binary executables and non-text NUL-heavy payloads.
 */
export function extractTextOrCode(buffer: Buffer, extension: string): TextCodeExtractionResult {
  // Block masqueraded binaries inside text/code extensions
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    throw new Error('Blocked masqueraded PE executable binary disguised as a text file.');
  }
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x7f &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x4c &&
    buffer[3] === 0x46
  ) {
    throw new Error('Blocked ELF binary disguised as a text file.');
  }

  let decoded: string;
  // Support UTF-16LE/BE BOM gracefully, otherwise require UTF-8 without NUL bytes
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    decoded = buffer.subarray(2).toString('utf16le');
  } else {
    const sample = buffer.subarray(0, Math.min(8192, buffer.length));
    if (sample.includes(0x00)) {
      throw new Error('File contains binary NUL bytes and cannot be parsed safely as text or source code.');
    }
    decoded = buffer.toString('utf8').replace(/^\uFEFF/, '');
  }

  const ext = extension.toLowerCase().replace(/^\./, '');
  const language = CODE_LANGUAGE_MAP[ext];
  const kind: 'code' | 'text' = language ? 'code' : 'text';

  const normalized = decoded.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const lineCount = lines.length;

  let output = normalized;
  let truncated = false;
  if (output.length > MAX_EXTRACTED_CHARS) {
    output = `${output.slice(0, MAX_EXTRACTED_CHARS)}\n\n[File truncated at ${MAX_EXTRACTED_CHARS.toLocaleString()} characters due to length]`;
    truncated = true;
  }

  return {
    text: output,
    kind,
    language: language || (ext === 'md' || ext === 'markdown' ? 'Markdown' : undefined),
    lineCount,
    charCount: output.length,
    truncated,
  };
}
