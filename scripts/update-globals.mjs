
import fs from 'fs';
const file = 'styles/globals.css';
let content = fs.readFileSync(file, 'utf8');

// Update body font-family
content = content.replace(/body\s*\{\s*background-color:\s*var\(--color-void\);\s*color:\s*var\(--color-text-primary\);\s*font-family:\s*var\(--font-sans\);/, 'body {\n  background-color: var(--color-void);\n  color: var(--color-text-primary);\n  font-family: var(--font-d-din);');

// Update h4, h5, h6
content = content.replace(/\.public-layout h4 \{ font-size/, '.public-layout h4 { font-family: var(--font-sans); font-size');
content = content.replace(/\.public-layout h5 \{ font-size/, '.public-layout h5 { font-family: var(--font-sans); font-size');
content = content.replace(/\.public-layout h6 \{ font-size/, '.public-layout h6 { font-family: var(--font-sans); font-size');

fs.writeFileSync(file, content, 'utf8');
console.log('done');

