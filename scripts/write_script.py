script = """import fs from 'fs';

function updateFile(filePath, replacer) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = replacer(content);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + filePath);
}

// 1. Buttons.tsx
updateFile('components/ui/Buttons.tsx', (content) => {
  return content.replace(/fontFamily: 'var\\(--font-sans\\)'/g, "fontFamily: 'var(--font-d-din)'");
});

// 2. Navigation.tsx (except nav-wordmark-text)
updateFile('components/layout/Navigation.tsx', (content) => {
  let newContent = content.replace(/fontFamily: 'var\\(--font-sans\\)'/g, "fontFamily: 'var(--font-d-din)'");
  newContent = newContent.replace(/className="nav-wordmark-text" style=\\{\\{[\s\S]*?fontFamily: 'var\\(--font-d-din\\)'/g, "className=\\"nav-wordmark-text\\" style={{\\n                fontFamily: 'var(--font-sans)'");
  return newContent;
});

// 3. Footer.tsx
updateFile('components/layout/Footer.tsx', (content) => {
  return content.replace(/fontWeight: 400,\s*fontFamily: 'var\\(--font-sans\\)',/, "fontWeight: 400,\\n              fontFamily: 'var(--font-d-din)',");
});

// 4. SoundToggle.tsx
updateFile('components/layout/SoundToggle.tsx', (content) => {
  return content.replace(/font-family: var\\(--font-sans, sans-serif\\);/g, "font-family: var(--font-d-din, sans-serif);");
});

// 5. contact/page.tsx
updateFile('app/(public)/contact/page.tsx', (content) => {
  return content.replace(/fontFamily: 'var\\(--font-sans, inherit\\)'/g, "fontFamily: 'var(--font-d-din, inherit)'");
});

// 6. quantum-foundation.css
updateFile('styles/quantum-foundation.css', (content) => {
  let c = content;
  c = c.replace(/\.q-body-xl \\{\\s*font-family: var\\(--font-space-grotesk, sans-serif\\);/g, ".q-body-xl {\\n  font-family: var(--font-d-din, sans-serif);");
  c = c.replace(/\.q-body \\{\\s*font-family: var\\(--font-space-grotesk, sans-serif\\);/g, ".q-body {\\n  font-family: var(--font-d-din, sans-serif);");
  c = c.replace(/\.q-small \\{\\s*font-family: var\\(--font-space-grotesk, sans-serif\\);/g, ".q-small {\\n  font-family: var(--font-d-din, sans-serif);");
  c = c.replace(/\.q-metadata \\{\\s*font-family: var\\(--font-space-mono, monospace\\);/g, ".q-metadata {\\n  font-family: var(--font-d-din, sans-serif);");
  c = c.replace(/\.q-button \\{[\s\S]*?font-family: var\\(--font-space-mono, monospace\\);/g, ".q-button {\\n  font-family: var(--font-d-din, sans-serif);");
  c = c.replace(/font-family: var\\(--font-space-mono, monospace\\);/g, "font-family: var(--font-d-din, sans-serif);");
  return c;
});

// 7. globals.css
updateFile('styles/globals.css', (content) => {
  let c = content;
  c = c.replace(/body \\{\\s*font-family: var\\(--font-sans\\);/g, "body {\\n  font-family: var(--font-d-din), Roboto, Arial, sans-serif;");
  
  if (!c.includes("h4, h5, h6")) {
     c = c.replace(/\\.public-layout h1, \\.public-layout h2, \\.public-layout h3 \\{/, ".public-layout h1, .public-layout h2, .public-layout h3, .public-layout h4, .public-layout h5, .public-layout h6 {\\n  font-family: var(--font-sans);");
  }
  return c;
});
"""

with open('scripts/apply_typography.mjs', 'w', encoding='utf-8') as f:
    f.write(script)

print("Done")
