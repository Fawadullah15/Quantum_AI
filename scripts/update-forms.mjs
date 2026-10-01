
import fs from 'fs';
const file = 'styles/globals.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/font-family:\s*var\(--font-sans,\s*sans-serif\);/, 'font-family: var(--font-d-din, sans-serif);');

fs.writeFileSync(file, content, 'utf8');
console.log('done');

