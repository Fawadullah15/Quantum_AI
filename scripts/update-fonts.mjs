import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    if (file.includes('admin') || file.includes('node_modules')) return;
    
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('components'), ...walk('styles')];

let updatedCount = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/var\(--font-mono(, monospace)?\)/g, 'var(--font-d-din)');
  
  // Also replace some var(--font-sans) cases where font size is explicitly small
  newContent = newContent.replace(/fontFamily:\s*'var\(--font-sans\)',[^}]*fontSize:\s*'0\.[6-9][a-z]+'/g, (match) => {
    return match.replace('var(--font-sans)', 'var(--font-d-din)');
  });
  
  newContent = newContent.replace(/fontFamily:\s*'var\(--font-sans\)',[^}]*fontSize:\s*'var\(--text-(xs|sm)\)'/g, (match) => {
    return match.replace('var(--font-sans)', 'var(--font-d-din)');
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    updatedCount++;
    console.log('Updated', file);
  }
}
console.log('Total files updated:', updatedCount);

